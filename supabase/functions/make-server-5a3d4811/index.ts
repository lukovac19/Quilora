import { Hono } from 'npm:hono';
import type { Context } from 'npm:hono';
import { logger } from 'npm:hono/logger';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';
import { CREDIT_RULES, TIER_LIMITS, type QuiloraTier } from './billing_config.ts';
import {
  applyBibliophileMonthlyRenewal,
  applyBookwormMonthlyRenewal,
  applyBookwormSandboxReadonly,
  chargeCredits,
  ensureBillingState,
  getLowBalanceStatus,
  getProfile,
  getTierEntitlements,
  grantCredits,
  markPrelaunchPurchaseProfile,
  setPlanSelectionCompleted,
  setTier,
} from './credit_service.ts';
import { getGenesisInventory } from './billing_genesis_service.ts';
import { dodoCreateCheckoutSession, dodoCreateCustomerPortalSession, getDodoApiKey } from './dodo_billing_api.ts';
import { hasProcessedDodoWebhook, markDodoWebhookProcessed, processDodoWebhookPayload, verifyDodoWebhook } from './dodo_webhook.ts';
import {
  adminLinkOrphanPayment,
  assertPrelaunchWebhookPurchaseAllowed,
  cancelGenesisReleaseSeat,
  cancelPrelaunchBookwormSage,
  createCheckoutPassthrough,
  enqueueEmail,
  getPublicLaunchComplete,
  processEmailOutboxBatch,
  reconcileOrphanPayments,
  reportWebhookDelayForUser,
  runNinetyDayRefundCheck,
  setPublicLaunchComplete,
} from './prelaunch_v4_service.ts';

const CORS_ALLOW_HEADERS = 'authorization, x-client-info, apikey, content-type';
const CORS_ALLOW_METHODS = 'GET, POST, PUT, DELETE, OPTIONS';

function corsAllowedOrigins(): Set<string> {
  const out = new Set<string>(['https://www.quilora.app']);
  const extras = Deno.env.get('CORS_EXTRA_ORIGINS')?.split(',') ?? [];
  for (const s of extras) {
    const t = s.trim().replace(/\/$/, '');
    if (t) out.add(t);
  }
  for (const k of ['PUBLIC_APP_URL', 'SITE_URL', 'APP_URL'] as const) {
    const u = Deno.env.get(k)?.trim().replace(/\/$/, '');
    if (u) out.add(u);
  }
  return out;
}

function pickCorsOrigin(req: Request): string {
  const origin = req.headers.get('Origin')?.trim().replace(/\/$/, '') ?? '';
  if (origin && corsAllowedOrigins().has(origin)) return origin;
  return 'https://www.quilora.app';
}

function corsHeadersFor(req: Request): Headers {
  const h = new Headers();
  h.set('Access-Control-Allow-Origin', pickCorsOrigin(req));
  h.set('Access-Control-Allow-Headers', CORS_ALLOW_HEADERS);
  h.set('Access-Control-Allow-Methods', CORS_ALLOW_METHODS);
  return h;
}

function withCors(res: Response, req: Request): Response {
  const headers = new Headers(res.headers);
  const cors = corsHeadersFor(req);
  cors.forEach((v, k) => headers.set(k, v));
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}

const app = new Hono();

type ChatTurn = { role: string; content: string };

async function deepseekChatCompletion(thread: ChatTurn[]): Promise<string | null> {
  const key = Deno.env.get('DEEPSEEK_API_KEY')?.trim();
  if (!key) return null;
  const system =
    'You are Quilora, a study assistant for PDFs and books. The user may include long document excerpts—use them as context. Answer clearly and stay concise unless asked otherwise.';
  const capped = thread.slice(-30).map((m) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: String(m.content ?? '').slice(0, 24_000),
  }));
  const messages = [{ role: 'system' as const, content: system }, ...capped];
  try {
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        max_tokens: 4096,
      }),
    });
    if (!res.ok) {
      console.error('DeepSeek HTTP', res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string | null } }> };
    const text = data?.choices?.[0]?.message?.content?.trim();
    return text || null;
  } catch (e) {
    console.error('DeepSeek fetch', e);
    return null;
  }
}

// Middleware (CORS is applied in Deno.serve wrapper so every response includes ACAO, including errors)
app.use('*', logger(console.log));

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/** Validates `Authorization: Bearer <Supabase access_token>` (case-insensitive, robust parsing). */
async function verifyAuth(authHeader: string | null | undefined): Promise<string | null> {
  const raw = authHeader?.trim();
  if (!raw) return null;
  const m = /^Bearer\s+([\s\S]+)$/i.exec(raw);
  const token = m?.[1]?.trim() ?? '';
  if (!token) return null;

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    console.warn('[auth] getUser failed', {
      code: error?.code ?? null,
      message: error?.message ? String(error.message).slice(0, 200) : null,
    });
    return null;
  }
  return user.id;
}

/** Edge logs — `JSON.stringify(Error)` is `{}`; use this for a readable payload. */
function jsonSafeError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack };
  }
  if (typeof err === 'object' && err !== null) {
    try {
      return JSON.parse(JSON.stringify(err)) as Record<string, unknown>;
    } catch {
      return { stringified: String(err) };
    }
  }
  return { value: String(err) };
}

/** Same plan keys / env names as client `src/lib/billingCheckout.ts` — resolves legacy `planKey` POST bodies on the Edge function. */
const CHECKOUT_PLAN_KEY_ENV: Record<string, readonly string[]> = {
  bookworm_monthly: ['NEXT_PUBLIC_PRICE_ID_BOOKWORM_MONTHLY', 'VITE_DODO_PRODUCT_BOOKWORM_MONTHLY'],
  bookworm_yearly: ['NEXT_PUBLIC_PRICE_ID_BOOKWORM_YEARLY', 'VITE_DODO_PRODUCT_BOOKWORM_YEARLY'],
  sage_monthly: ['NEXT_PUBLIC_PRICE_ID_SAGE_MONTHLY', 'VITE_DODO_PRODUCT_BIBLIOPHILE_MONTHLY'],
  sage_yearly: ['NEXT_PUBLIC_PRICE_ID_SAGE_YEARLY', 'VITE_DODO_PRODUCT_BIBLIOPHILE_YEARLY'],
  lifetime_early_bird: ['NEXT_PUBLIC_PRICE_ID_LIFETIME_EARLY_BIRD', 'VITE_DODO_PRODUCT_GENESIS_80'],
  lifetime_standard: ['NEXT_PUBLIC_PRICE_ID_LIFETIME_STANDARD', 'VITE_DODO_PRODUCT_GENESIS_119'],
  lifetime_plus_sage: ['NEXT_PUBLIC_PRICE_ID_LIFETIME_PLUS_SAGE'],
  boost_pack: ['VITE_DODO_PRODUCT_BOOST_PACK'],
};

function productIdFromPlanKeyEnv(planKey: string): string {
  const pk = planKey.trim();
  const keys = CHECKOUT_PLAN_KEY_ENV[pk];
  if (!keys) return '';
  for (const k of keys) {
    const v = Deno.env.get(k)?.trim();
    if (v) return v;
  }
  return '';
}

/** Accept camelCase, snake_case, price IDs, and optional `{ data: { ... } }` wrappers from different clients. */
function pickProductIdFromCheckoutBody(raw: Record<string, unknown>): string {
  const nested =
    typeof raw.data === 'object' && raw.data !== null ? (raw.data as Record<string, unknown>) : null;
  const pick = (o: Record<string, unknown> | null, k: string) => String(o?.[k] ?? '').trim();
  const direct =
    pick(raw, 'productId') ||
    pick(raw, 'product_id') ||
    pick(raw, 'priceId') ||
    pick(raw, 'price_id') ||
    pick(raw, 'dodoProductId') ||
    pick(nested, 'productId') ||
    pick(nested, 'product_id') ||
    pick(nested, 'priceId') ||
    pick(nested, 'price_id');
  if (direct) return direct;
  const planKey =
    pick(raw, 'planKey') ||
    pick(raw, 'plan_key') ||
    pick(nested, 'planKey') ||
    pick(nested, 'plan_key');
  return productIdFromPlanKeyEnv(planKey);
}

function pickProductKindFromCheckoutBody(raw: Record<string, unknown>): string {
  const nested =
    typeof raw.data === 'object' && raw.data !== null ? (raw.data as Record<string, unknown>) : null;
  const fromKind = String(
    raw.productKind ??
      raw.product_kind ??
      raw.checkoutProduct ??
      nested?.productKind ??
      nested?.product_kind ??
      '',
  ).trim();
  if (fromKind) return fromKind;
  const planKey = String(raw.planKey ?? raw.plan_key ?? nested?.planKey ?? nested?.plan_key ?? '').trim();
  if (planKey) return planKey;
  return 'checkout';
}

function normalizedTierFromLegacy(raw: string | undefined): QuiloraTier {
  if (raw === 'lifetime' || raw === 'genesis') return 'genesis';
  if (raw === 'hardquest' || raw === 'bibliophile') return 'bibliophile';
  return 'bookworm';
}

function computeUploadCredits(pages: number | undefined): number {
  const n = Math.max(1, Number(pages ?? 1));
  return Math.max(CREDIT_RULES.uploadPer100Pages, Math.ceil(n / 100) * CREDIT_RULES.uploadPer100Pages);
}

// ============================================
// AUTH ROUTES
// ============================================

app.post('/make-server-5a3d4811/auth/signup', async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    
    if (!email || !password || !name) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      email_confirm: true, // Auto-confirm since email server not configured
    });

    if (error) {
      console.error('Signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    // Store user profile in KV
    const userProfile = {
      id: data.user.id,
      email,
      name,
      subscriptionTier: 'bookworm',
      questionsAsked: 0,
      lastQuestionTime: null,
      cooldownUntil: null,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`user:${data.user.id}`, userProfile);
    await ensureBillingState(supabase, data.user.id);

    return c.json({ user: userProfile, accessToken: data.session?.access_token });
  } catch (error) {
    console.error('Signup error:', error);
    return c.json({ error: 'Internal server error during signup' }, 500);
  }
});

app.post('/make-server-5a3d4811/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: 'Missing email or password' }, 400);
    }

    // Sign in with Supabase Auth
    const supabaseClient = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error);
      return c.json({ error: error.message }, 401);
    }

    const userProfile = await kv.get(`user:${data.user.id}`);
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle();

    if (!profile) {
      return c.json({ error: 'User profile not found' }, 404);
    }

    await ensureBillingState(supabase, data.user.id);
    const merged = userProfile ?? {
      id: data.user.id,
      email: profile.email,
      name: profile.full_name ?? data.user.email?.split('@')[0] ?? 'Reader',
      subscriptionTier: profile.tier,
    };
    return c.json({ user: merged, accessToken: data.session.access_token });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Internal server error during login' }, 500);
  }
});

const handleAuthMe = async (c: Context) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userProfile = await kv.get(`user:${userId}`);
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (!profile) {
      return c.json({ error: 'User not found' }, 404);
    }

    const billing = await getTierEntitlements(supabase, userId);
    const lowBalance = await getLowBalanceStatus(supabase, userId);
    const merged = userProfile ?? {
      id: userId,
      email: profile.email,
      name: profile.full_name ?? profile.email?.split('@')[0] ?? 'Reader',
      subscriptionTier: profile.tier,
    };
    return c.json({ user: merged, billing, lowBalance });
  } catch (err) {
    console.error('billing/me error:', JSON.stringify(jsonSafeError(err), null, 2));
    console.error('billing/me error (raw):', err);
    return c.json({ error: 'Internal server error fetching user' }, 500);
  }
};

app.get('/make-server-5a3d4811/auth/me', handleAuthMe);
/** Alias — some clients call `billing/me` instead of `auth/me`. */
app.get('/make-server-5a3d4811/billing/me', handleAuthMe);

// ============================================
// PDF ROUTES
// ============================================

app.post('/make-server-5a3d4811/pdfs/upload', async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { name, fileSize, pages } = await c.req.json();
    const uploadCost = computeUploadCredits(pages);
    await chargeCredits(supabase, {
      userId,
      amount: uploadCost,
      eventType: 'source_upload',
      idempotencyKey: `upload_${name}_${fileSize}_${pages ?? 1}`,
      metadata: { pages: Number(pages ?? 1), fileName: name },
    });

    const pdfId = `pdf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const pdf = {
      id: pdfId,
      userId,
      name,
      fileSize,
      pages,
      status: 'processing',
      uploadDate: new Date().toISOString(),
    };

    await kv.set(`pdf:${pdfId}`, pdf);
    
    // Add to user's PDF list
    const userPdfs = await kv.get(`user_pdfs:${userId}`) || [];
    userPdfs.push(pdfId);
    await kv.set(`user_pdfs:${userId}`, userPdfs);

    // Simulate processing
    setTimeout(async () => {
      pdf.status = 'ready';
      await kv.set(`pdf:${pdfId}`, pdf);
    }, 3000);

    const lowBalance = await getLowBalanceStatus(supabase, userId);
    return c.json({ pdf, creditCost: uploadCost, lowBalance });
  } catch (error) {
    console.error('PDF upload error:', error);
    if (error instanceof Error && error.message === 'INSUFFICIENT_CREDITS') {
      return c.json({ error: 'Insufficient credits. Please purchase a Boost Pack to continue.' }, 402);
    }
    return c.json({ error: 'Error uploading PDF' }, 500);
  }
});

app.get('/make-server-5a3d4811/pdfs', async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const pdfIds = await kv.get(`user_pdfs:${userId}`) || [];
    const pdfs = await kv.mget(pdfIds.map((id: string) => `pdf:${id}`));

    return c.json({ pdfs: pdfs.filter((p: any) => p !== null) });
  } catch (error) {
    console.error('Get PDFs error:', error);
    return c.json({ error: 'Error fetching PDFs' }, 500);
  }
});

app.delete('/make-server-5a3d4811/pdfs/:pdfId', async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const pdfId = c.req.param('pdfId');
    
    // Remove from user's PDF list
    const userPdfs = await kv.get(`user_pdfs:${userId}`) || [];
    const filtered = userPdfs.filter((id: string) => id !== pdfId);
    await kv.set(`user_pdfs:${userId}`, filtered);
    
    // Delete PDF data
    await kv.del(`pdf:${pdfId}`);
    
    // Delete related sessions
    const sessionIds = await kv.get(`pdf_sessions:${pdfId}`) || [];
    for (const sessionId of sessionIds) {
      await kv.del(`session:${sessionId}`);
      await kv.del(`chat:${sessionId}`);
    }
    await kv.del(`pdf_sessions:${pdfId}`);

    return c.json({ success: true });
  } catch (error) {
    console.error('Delete PDF error:', error);
    return c.json({ error: 'Error deleting PDF' }, 500);
  }
});

// ============================================
// SESSION ROUTES
// ============================================

app.post('/make-server-5a3d4811/sessions', async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { pdfId, bookName } = await c.req.json();

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session = {
      id: sessionId,
      userId,
      pdfId,
      bookName,
      startDate: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      messagesCount: 0,
    };

    await kv.set(`session:${sessionId}`, session);
    
    // Add to user's sessions
    const userSessions = await kv.get(`user_sessions:${userId}`) || [];
    userSessions.push(sessionId);
    await kv.set(`user_sessions:${userId}`, userSessions);
    
    // Add to PDF's sessions
    const pdfSessions = await kv.get(`pdf_sessions:${pdfId}`) || [];
    pdfSessions.push(sessionId);
    await kv.set(`pdf_sessions:${pdfId}`, pdfSessions);

    return c.json({ session });
  } catch (error) {
    console.error('Create session error:', error);
    return c.json({ error: 'Error creating session' }, 500);
  }
});

app.get('/make-server-5a3d4811/sessions', async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const sessionIds = await kv.get(`user_sessions:${userId}`) || [];
    const sessions = await kv.mget(sessionIds.map((id: string) => `session:${id}`));

    return c.json({ sessions: sessions.filter((s: any) => s !== null) });
  } catch (error) {
    console.error('Get sessions error:', error);
    return c.json({ error: 'Error fetching sessions' }, 500);
  }
});

app.get('/make-server-5a3d4811/sessions/:sessionId', async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const sessionId = c.req.param('sessionId');
    const session = await kv.get(`session:${sessionId}`);

    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    if (session.userId !== userId) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    return c.json({ session });
  } catch (error) {
    console.error('Get session error:', error);
    return c.json({ error: 'Error fetching session' }, 500);
  }
});

// ============================================
// SANDBOX ROUTES
// ============================================

app.get('/make-server-5a3d4811/sandboxes', async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    const { data, error } = await supabase
      .from('sandboxes')
      .select('id, user_id, name, created_at, last_opened_at, read_only')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .order('last_opened_at', { ascending: false });
    if (error) throw error;
    const sandboxes = (data ?? []).map((row: Record<string, unknown>) => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      createdAt: row.created_at,
      lastOpenedAt: row.last_opened_at,
      readOnly: row.read_only,
    }));
    return c.json({ sandboxes });
  } catch (error) {
    console.error('Get sandboxes error:', error);
    return c.json({ error: 'Error fetching sandboxes' }, 500);
  }
});

app.post('/make-server-5a3d4811/sandboxes', async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    const { name } = await c.req.json();
    const billing = await getTierEntitlements(supabase, userId);
    if (billing.maxSandboxes !== null) {
      const { count, error: countError } = await supabase
        .from('sandboxes')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_deleted', false);
      if (countError) throw countError;
      if ((count ?? 0) >= billing.maxSandboxes) {
        return c.json({
          error: 'Sandbox limit reached.',
          requiresUpgrade: true,
          limit: billing.maxSandboxes,
          currentTier: billing.tier,
        }, 409);
      }
    }
    const { data: inserted, error } = await supabase
      .from('sandboxes')
      .insert({ user_id: userId, name: String(name ?? 'Untitled Sandbox') })
      .select('id, user_id, name, created_at, last_opened_at')
      .single();
    if (error) {
      if (String(error.message || '').includes('SANDBOX_LIMIT')) {
        return c.json({
          error: 'Sandbox limit reached.',
          requiresUpgrade: true,
          limit: billing.maxSandboxes,
          currentTier: billing.tier,
        }, 409);
      }
      throw error;
    }
    const sandbox = {
      id: inserted.id,
      userId: inserted.user_id,
      name: inserted.name,
      createdAt: inserted.created_at,
      lastOpenedAt: inserted.last_opened_at,
    };
    return c.json({ sandbox });
  } catch (error) {
    console.error('Create sandbox error:', error);
    return c.json({ error: 'Error creating sandbox' }, 500);
  }
});

// ============================================
// CHAT ROUTES
// ============================================

app.post('/make-server-5a3d4811/chat/:sessionId', async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const sessionId = c.req.param('sessionId');
    const { message } = await c.req.json();

    const { data: sandboxRow } = await supabase.from('sandboxes').select('id').eq('id', sessionId).eq('user_id', userId).maybeSingle();
    const session = await kv.get(`session:${sessionId}`);

    if (!sandboxRow && (!session || session.userId !== userId)) {
      return c.json({ error: 'Session not found or unauthorized' }, 403);
    }

    // Get chat history
    const chatHistory = await kv.get(`chat:${sessionId}`) || [];
    
    // Add user message
    const userMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    chatHistory.push(userMessage);

    const threadForModel: ChatTurn[] = chatHistory.map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    }));
    const deepText = await deepseekChatCompletion(threadForModel);
    const fallback =
      `Ovo je simulirani odgovor na pitanje: "${String(message).slice(0, 200)}". Postavite tajnu DEEPSEEK_API_KEY na Edge funkciji za pravi odgovor modela.`;
    const aiResponse = {
      id: `msg_${Date.now()}_ai`,
      role: 'assistant',
      content: deepText ?? fallback,
      page: Math.floor(Math.random() * 100) + 1,
      timestamp: new Date().toISOString(),
    };
    chatHistory.push(aiResponse);

    // Save chat
    await kv.set(`chat:${sessionId}`, chatHistory);

    if (session) {
      session.messagesCount = chatHistory.length;
      session.lastActive = new Date().toISOString();
      await kv.set(`session:${sessionId}`, session);
    }

    const lowBalance = await getLowBalanceStatus(supabase, userId);
    return c.json({ message: aiResponse, lowBalance });
  } catch (error) {
    console.error('Chat error:', error);
    if (error instanceof Error && error.message === 'INSUFFICIENT_CREDITS') {
      return c.json({ error: 'Insufficient credits. Please purchase a Boost Pack to continue.' }, 402);
    }
    return c.json({ error: 'Error processing chat message' }, 500);
  }
});

app.get('/make-server-5a3d4811/chat/:sessionId', async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const sessionId = c.req.param('sessionId');
    const { data: sandboxRow } = await supabase.from('sandboxes').select('id').eq('id', sessionId).eq('user_id', userId).maybeSingle();
    const session = await kv.get(`session:${sessionId}`);

    if (!sandboxRow && (!session || session.userId !== userId)) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const chatHistory = await kv.get(`chat:${sessionId}`) || [];

    return c.json({ messages: chatHistory });
  } catch (error) {
    console.error('Get chat error:', error);
    return c.json({ error: 'Error fetching chat history' }, 500);
  }
});

// ============================================
// SAVED ITEMS ROUTES
// ============================================

app.post('/make-server-5a3d4811/saved', async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { type, content, page, sessionId, bookName } = await c.req.json();

    const itemId = `saved_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const item = {
      id: itemId,
      userId,
      type,
      content,
      page,
      sessionId,
      bookName,
      dateSaved: new Date().toISOString(),
    };

    await kv.set(`saved:${itemId}`, item);
    
    // Add to user's saved items
    const userSaved = await kv.get(`user_saved:${userId}`) || [];
    userSaved.push(itemId);
    await kv.set(`user_saved:${userId}`, userSaved);

    return c.json({ item });
  } catch (error) {
    console.error('Save item error:', error);
    return c.json({ error: 'Error saving item' }, 500);
  }
});

app.get('/make-server-5a3d4811/saved', async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const itemIds = await kv.get(`user_saved:${userId}`) || [];
    const items = await kv.mget(itemIds.map((id: string) => `saved:${id}`));

    return c.json({ items: items.filter((i: any) => i !== null) });
  } catch (error) {
    console.error('Get saved items error:', error);
    return c.json({ error: 'Error fetching saved items' }, 500);
  }
});

app.delete('/make-server-5a3d4811/saved/:itemId', async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const itemId = c.req.param('itemId');
    
    // Remove from user's saved items
    const userSaved = await kv.get(`user_saved:${userId}`) || [];
    const filtered = userSaved.filter((id: string) => id !== itemId);
    await kv.set(`user_saved:${userId}`, filtered);
    
    // Delete item
    await kv.del(`saved:${itemId}`);

    return c.json({ success: true });
  } catch (error) {
    console.error('Delete saved item error:', error);
    return c.json({ error: 'Error deleting item' }, 500);
  }
});

// ============================================
// SUBSCRIPTION ROUTES
// ============================================

app.post('/make-server-5a3d4811/subscription/upgrade', async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { tier } = await c.req.json();
    const normalizedTier = normalizedTierFromLegacy(tier);
    if (!['bookworm', 'bibliophile', 'genesis'].includes(normalizedTier)) {
      return c.json({ error: 'Invalid subscription tier' }, 400);
    }

    const userProfile = await kv.get(`user:${userId}`);
    
    if (!userProfile) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Update subscription
    userProfile.subscriptionTier = normalizedTier;
    userProfile.questionsAsked = 0;
    userProfile.cooldownUntil = null;
    
    await kv.set(`user:${userId}`, userProfile);
    const billingState = await setTier(supabase, userId, normalizedTier);
    if (normalizedTier === 'bookworm') {
      await applyBookwormSandboxReadonly(supabase, userId);
    }
    return c.json({ user: userProfile, billing: billingState });
  } catch (error) {
    console.error('Upgrade subscription error:', error);
    return c.json({ error: 'Error upgrading subscription' }, 500);
  }
});

// ============================================
// BILLING, CREDITS, PAYMENTS
// ============================================

app.get('/make-server-5a3d4811/billing/entitlements', async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    const entitlements = await getTierEntitlements(supabase, userId);
    const lowBalance = await getLowBalanceStatus(supabase, userId);
    return c.json({ entitlements, lowBalance });
  } catch (error) {
    console.error('Get entitlements error:', error);
    return c.json({ error: 'Error fetching billing entitlements' }, 500);
  }
});

app.get('/make-server-5a3d4811/billing/genesis-inventory', async (c) => {
  try {
    return c.json({ inventory: await getGenesisInventory(supabase) });
  } catch (error) {
    console.error('Get genesis inventory error:', error);
    return c.json({ error: 'Error fetching Genesis inventory' }, 500);
  }
});

app.get('/make-server-5a3d4811/billing/dodo/checkout-eligibility', async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    const productKind = String(c.req.query('productKind') ?? '').trim();
    if (!productKind) return c.json({ error: 'Missing productKind' }, 400);
    const dup = await assertPrelaunchWebhookPurchaseAllowed(supabase, userId, productKind);
    const { data: userPlan } = await supabase
      .from('user_plans')
      .select('plan, subscription_status, is_lifetime, subscription_period_end')
      .eq('user_id', userId)
      .maybeSingle();
    return c.json({
      ok: dup.ok,
      error: dup.ok ? null : dup.error,
      userPlan: userPlan ?? null,
    });
  } catch (error) {
    console.error('checkout-eligibility', error);
    return c.json({ error: 'eligibility_failed' }, 500);
  }
});

app.get('/make-server-5a3d4811/billing/app-state', async (c) => {
  try {
    const publicLaunchComplete = await getPublicLaunchComplete(supabase);
    return c.json({ publicLaunchComplete });
  } catch (error) {
    console.error('app-state', error);
    return c.json({ error: 'app_state_failed' }, 500);
  }
});

app.post('/make-server-5a3d4811/billing/checkout-passthrough', async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    const { expectedCheckoutEmail } = (await c.req.json()) as { expectedCheckoutEmail?: string };
    const prof = await getProfile(supabase, userId);
    const email = (expectedCheckoutEmail ?? (prof?.email as string) ?? '').trim();
    if (!email) return c.json({ error: 'Missing expectedCheckoutEmail' }, 400);
    const { token, expiresAt } = await createCheckoutPassthrough(supabase, userId, email);
    return c.json({ passthroughToken: token, expiresAt });
  } catch (error) {
    console.error('checkout-passthrough', error);
    return c.json({ error: 'checkout_passthrough_failed' }, 500);
  }
});

app.post('/make-server-5a3d4811/billing/cancel-prelaunch', async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    const r = await cancelPrelaunchBookwormSage(supabase, userId);
    if (!r.ok) return c.json({ error: r.error }, 400);
    return c.json({ ok: true });
  } catch (error) {
    console.error('cancel-prelaunch', error);
    return c.json({ error: 'cancel_failed' }, 500);
  }
});

app.post('/make-server-5a3d4811/billing/cancel-genesis', async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    await cancelGenesisReleaseSeat(supabase, userId);
    return c.json({ ok: true });
  } catch (error) {
    console.error('cancel-genesis', error);
    return c.json({ error: 'cancel_genesis_failed' }, 500);
  }
});

app.post('/make-server-5a3d4811/billing/report-webhook-delay', async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    const body = (await c.req.json()) as { userId?: string; productKind?: string };
    if (body.userId !== userId) return c.json({ error: 'Forbidden' }, 403);
    await reportWebhookDelayForUser(supabase, userId, body.productKind ?? null);
    return c.json({ ok: true });
  } catch (error) {
    console.error('report-webhook-delay', error);
    return c.json({ error: 'report_failed' }, 500);
  }
});

app.post('/make-server-5a3d4811/internal/cron/reconcile-orphan-payments', async (c) => {
  try {
    if (c.req.header('x-cron-secret') !== Deno.env.get('CRON_SECRET')) return c.json({ error: 'Forbidden' }, 403);
    await reconcileOrphanPayments(supabase);
    return c.json({ ok: true });
  } catch (error) {
    console.error('cron reconcile', error);
    return c.json({ error: 'cron_failed' }, 500);
  }
});

/** EC-05 — manual link of orphan provider transaction row to an existing Supabase user (support / admin). */
app.post('/make-server-5a3d4811/internal/admin/link-orphan-payment', async (c) => {
  try {
    if (c.req.header('x-admin-billing-secret') !== Deno.env.get('ADMIN_BILLING_SECRET')) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    const body = (await c.req.json()) as { transactionRowId?: string; targetUserId?: string; actor?: string };
    if (!body.transactionRowId || !body.targetUserId) return c.json({ error: 'Bad request' }, 400);
    const r = await adminLinkOrphanPayment(supabase, {
      transactionRowId: body.transactionRowId,
      targetUserId: body.targetUserId,
      actor: body.actor,
    });
    if (!r.ok) return c.json({ error: r.error }, 400);
    return c.json({ ok: true });
  } catch (error) {
    console.error('admin link orphan', error);
    return c.json({ error: 'admin_link_failed' }, 500);
  }
});

app.post('/make-server-5a3d4811/internal/cron/ninety-day-refund', async (c) => {
  try {
    if (c.req.header('x-cron-secret') !== Deno.env.get('CRON_SECRET')) return c.json({ error: 'Forbidden' }, 403);
    const r = await runNinetyDayRefundCheck(supabase);
    return c.json(r);
  } catch (error) {
    console.error('cron ninety', error);
    return c.json({ error: 'cron_failed' }, 500);
  }
});

app.post('/make-server-5a3d4811/internal/cron/process-email-outbox', async (c) => {
  try {
    if (c.req.header('x-cron-secret') !== Deno.env.get('CRON_SECRET')) return c.json({ error: 'Forbidden' }, 403);
    await processEmailOutboxBatch(supabase, 25);
    return c.json({ ok: true });
  } catch (error) {
    console.error('cron email', error);
    return c.json({ error: 'cron_failed' }, 500);
  }
});

app.post('/make-server-5a3d4811/admin/finalize-public-launch', async (c) => {
  try {
    if (c.req.header('x-cron-secret') !== Deno.env.get('CRON_SECRET')) return c.json({ error: 'Forbidden' }, 403);
    await setPublicLaunchComplete(supabase, true);
    const { data: payers } = await supabase
      .from('profiles')
      .select('email')
      .not('first_prelaunch_purchase_at', 'is', null);
    for (const p of payers ?? []) {
      await enqueueEmail(supabase, 'email_2_launch_day', String(p.email), {
        message: 'Quilora is live — your canvas is ready.',
      });
    }
    await processEmailOutboxBatch(supabase, 50);
    return c.json({ ok: true });
  } catch (error) {
    console.error('finalize launch', error);
    return c.json({ error: 'finalize_failed' }, 500);
  }
});

app.post('/make-server-5a3d4811/billing/boost-pack/simulate', async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    const idempotencyKey = `boost_sim_${Date.now()}`;
    const grant = await grantCredits(supabase, {
      userId,
      amount: CREDIT_RULES.boostPackCredits,
      eventType: 'boost_pack_purchase',
      idempotencyKey,
      metadata: { mode: 'simulated' },
    });
    return c.json({ success: true, creditsAdded: CREDIT_RULES.boostPackCredits, balance: grant.balance });
  } catch (error) {
    console.error('Boost pack simulation error:', error);
    return c.json({ error: 'Error adding boost pack credits' }, 500);
  }
});

function checkoutHandlerEnvFlags(): Record<string, boolean> {
  return {
    hasSupabaseUrl: Boolean(Deno.env.get('SUPABASE_URL')?.trim()),
    hasServiceRoleKey: Boolean(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim()),
    hasDodoApiKey: Boolean(getDodoApiKey()),
    hasPublicAppUrl: Boolean(Deno.env.get('PUBLIC_APP_URL')?.trim()),
    hasSiteUrl: Boolean(Deno.env.get('SITE_URL')?.trim() || Deno.env.get('APP_URL')?.trim()),
  };
}

/** Dodo-only checkout session (no Paddle). */
const handleDodoCheckoutSession = async (c: Context) => {
  try {
    console.log('[checkout] request', {
      path: new URL(c.req.url).pathname,
      hasAuthorizationHeader: Boolean(c.req.header('Authorization')?.trim()),
      ...checkoutHandlerEnvFlags(),
    });

    const userId = await verifyAuth(c.req.header('Authorization'));
    if (!userId) {
      return c.json(
        {
          error: 'Unauthorized',
          code: 'AUTH_JWT_INVALID',
          hint: 'Send Authorization: Bearer <Supabase access_token> from auth.getSession() (not the anon key).',
        },
        401,
      );
    }

    if (!getDodoApiKey()) {
      return c.json(
        {
          error: 'Dodo Payments is not configured on this function.',
          code: 'DODO_NOT_CONFIGURED',
          hint: 'Set DODO_PAYMENTS_API_KEY or DODO_API_KEY in Edge function secrets.',
        },
        503,
      );
    }

    let raw: Record<string, unknown>;
    try {
      raw = (await c.req.json()) as Record<string, unknown>;
    } catch (parseErr) {
      console.error('billing/checkout-session JSON parse error:', JSON.stringify(jsonSafeError(parseErr), null, 2));
      return c.json({ error: 'Invalid JSON body', code: 'INVALID_JSON' }, 400);
    }
    const productId = pickProductIdFromCheckoutBody(raw);
    if (!productId) {
      console.error(
        'billing/checkout-session missing productId; content-type:',
        c.req.header('content-type') ?? '(none)',
        'body keys:',
        Object.keys(raw),
        'body:',
        JSON.stringify(raw, null, 2),
      );
      return c.json({ error: 'Missing productId', code: 'MISSING_PRODUCT_ID' }, 400);
    }

    const { data: prof } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    const pr = prof as Record<string, unknown> | null;
    const email = (pr?.email as string | undefined) ?? null;
    const rawName = (pr?.full_name ?? pr?.display_name) as string | undefined;
    const fullName = rawName?.trim() || null;

    const productKind = pickProductKindFromCheckoutBody(raw);
    const dup = await assertPrelaunchWebhookPurchaseAllowed(supabase, userId, productKind);
    if (!dup.ok) {
      return c.json({ error: dup.error, code: 'CHECKOUT_NOT_ALLOWED' }, 409);
    }
    const meta: Record<string, string> = { userId, productKind };
    const em = email?.trim();
    if (em) {
      try {
        const pt = await createCheckoutPassthrough(supabase, userId, em);
        meta.passthroughToken = pt.token;
      } catch {
        /* optional */
      }
    }
    const site =
      Deno.env.get('PUBLIC_APP_URL')?.trim() ||
      Deno.env.get('SITE_URL')?.trim() ||
      Deno.env.get('APP_URL')?.trim() ||
      'https://www.quilora.app';
    const returnUrl =
      Deno.env.get('DODO_CHECKOUT_RETURN_URL')?.trim() || `${site.replace(/\/$/, '')}/checkout/success`;
    const cancelUrl =
      Deno.env.get('DODO_CHECKOUT_CANCEL_URL')?.trim() || `${site.replace(/\/$/, '')}/early-access`;
    const session = await dodoCreateCheckoutSession({
      productCart: [{ product_id: productId, quantity: 1 }],
      metadata: meta,
      customerEmail: email,
      customerName: fullName,
      lockCustomerEmail: true,
      returnUrl,
      cancelUrl,
    });
    if ('error' in session) {
      console.error('dodo checkout-session Dodo API error', String(session.error).slice(0, 400));
      return c.json(
        {
          error: 'Dodo checkout failed',
          code: 'DODO_CHECKOUT_REJECTED',
          detail: String(session.error).slice(0, 400),
        },
        502,
      );
    }
    return c.json({ checkoutUrl: session.checkoutUrl });
  } catch (error) {
    console.error('dodo checkout-session', jsonSafeError(error));
    const msg = error instanceof Error ? error.message : String(error);
    if (/Dodo API key missing|Dodo merchant API key missing|not configured/i.test(msg)) {
      return c.json({ error: 'Dodo Payments not configured.', code: 'DODO_NOT_CONFIGURED' }, 503);
    }
    return c.json(
      {
        error: 'checkout_session_failed',
        code: 'CHECKOUT_EXCEPTION',
        hint: msg.slice(0, 200),
      },
      500,
    );
  }
};

app.post('/make-server-5a3d4811/billing/dodo/checkout-session', handleDodoCheckoutSession);
/** Alias — some clients call `billing/create-checkout-session` instead of `billing/dodo/checkout-session`. */
app.post('/make-server-5a3d4811/billing/create-checkout-session', handleDodoCheckoutSession);

app.post('/make-server-5a3d4811/billing/dodo/customer-portal', async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    const { data: prof } = await supabase
      .from('profiles')
      .select('dodo_customer_id')
      .eq('id', userId)
      .maybeSingle();
    const customerId = (prof?.dodo_customer_id as string | undefined)?.trim();
    if (!customerId) return c.json({ error: 'No billing customer on file' }, 400);
    const site = Deno.env.get('PUBLIC_APP_URL')?.trim() || 'https://www.quilora.app';
    const portal = await dodoCreateCustomerPortalSession(customerId, `${site}/dashboard`);
    if ('error' in portal) {
      console.error('dodo portal', portal.error);
      return c.json({ error: portal.error }, 502);
    }
    return c.json({ portalUrl: portal.link });
  } catch (error) {
    console.error('dodo portal', error);
    return c.json({ error: 'portal_failed' }, 500);
  }
});

app.post('/make-server-5a3d4811/payments/dodo/webhook', async (c) => {
  try {
    const rawBody = await c.req.text();
    const hdr = (name: string) => c.req.header(name) ?? undefined;
    const sig = await verifyDodoWebhook(rawBody, {
      'webhook-id': hdr('webhook-id'),
      'webhook-signature': hdr('webhook-signature'),
      'webhook-timestamp': hdr('webhook-timestamp'),
    });
    if (!sig.ok) return c.json({ error: 'Invalid webhook signature' }, 401);

    const webhookId = hdr('webhook-id')?.trim() ?? '';
    if (!webhookId) return c.json({ error: 'Missing webhook-id' }, 400);
    if (await hasProcessedDodoWebhook(supabase, webhookId)) return c.json({ ok: true, duplicate: true });

    await processDodoWebhookPayload(supabase, sig.payload, webhookId);
    await markDodoWebhookProcessed(supabase, webhookId);
    return c.json({ ok: true });
  } catch (error) {
    console.error('Dodo webhook error:', error);
    return c.json({ error: 'Error handling Dodo webhook' }, 500);
  }
});

/**
 * Internal: apply an already-verified Dodo webhook payload (e.g. Next.js App Router entry forwards here).
 * Secured with Supabase service role JWT only.
 */
app.post('/make-server-5a3d4811/billing/dodo/webhook-apply', async (c) => {
  try {
    const auth = c.req.header('Authorization') ?? '';
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim();
    if (!key || auth !== `Bearer ${key}`) return c.json({ error: 'Forbidden' }, 403);
    const body = (await c.req.json()) as { payload?: Record<string, unknown>; webhookId?: string };
    if (!body.payload || !body.webhookId?.trim()) return c.json({ error: 'Bad request' }, 400);
    await processDodoWebhookPayload(supabase, body.payload, body.webhookId.trim());
    return c.json({ ok: true });
  } catch (error) {
    console.error('webhook-apply', error);
    return c.json({ error: 'webhook_apply_failed' }, 500);
  }
});

// ============================================
// QUESTION GENERATION ROUTES
// ============================================

app.post('/make-server-5a3d4811/questions/generate', async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { sessionId, count, mode } = await c.req.json();
    const questionCount = Math.min(25, Math.max(5, Number(count ?? 10)));
    const ratio = (questionCount - 5) / 20;
    const masteryCost = Math.round(
      CREDIT_RULES.masteryBlitzMin + ratio * (CREDIT_RULES.masteryBlitzMax - CREDIT_RULES.masteryBlitzMin),
    );
    await chargeCredits(supabase, {
      userId,
      amount: masteryCost,
      eventType: 'mastery_blitz',
      idempotencyKey: `mastery_${sessionId ?? 'sessionless'}_${Date.now()}`,
      sandboxId: typeof sessionId === 'string' && /^[0-9a-f-]{36}$/i.test(sessionId) ? sessionId : null,
      metadata: { mode, questionCount, sessionId },
    });

    // Generate mock questions
    const questions = Array.from({ length: questionCount }, (_, i) => ({
      id: `q_${Date.now()}_${i}`,
      question: `Primjer pitanja ${i + 1} za ${mode} mode?`,
      answer: `Ovo je simulirani odgovor na pitanje ${i + 1}.`,
      page: Math.floor(Math.random() * 100) + 1,
      difficulty: mode,
    }));

    const lowBalance = await getLowBalanceStatus(supabase, userId);
    return c.json({ questions, creditCost: masteryCost, lowBalance });
  } catch (error) {
    console.error('Generate questions error:', error);
    if (error instanceof Error && error.message === 'INSUFFICIENT_CREDITS') {
      return c.json({ error: 'Insufficient credits. Please purchase a Boost Pack to continue.' }, 402);
    }
    return c.json({ error: 'Error generating questions' }, 500);
  }
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeadersFor(req) });
  }
  try {
    return withCors(await app.fetch(req), req);
  } catch (err) {
    console.error('Edge handler error', err);
    const h = corsHeadersFor(req);
    h.set('Content-Type', 'application/json');
    return new Response(JSON.stringify({ error: 'internal_server_error' }), {
      status: 500,
      headers: h,
    });
  }
});
