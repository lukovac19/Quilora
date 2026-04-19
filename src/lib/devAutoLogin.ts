import { supabase } from './supabase';

/**
 * When `import.meta.env.DEV` and `VITE_DEV_AUTO_LOGIN=true`, signs in with
 * `VITE_DEV_TEST_EMAIL` / `VITE_DEV_TEST_PASSWORD` if there is no session yet.
 * Set those in `.env.local` only — never commit passwords.
 */
export async function tryDevAutoLogin(): Promise<void> {
  if (!import.meta.env.DEV) return;
  if (import.meta.env.VITE_DEV_AUTO_LOGIN !== 'true') return;

  /** Avoid racing `signInWithPassword` while the user is logging in manually on `/auth`. */
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/auth')) {
    return;
  }

  const email = import.meta.env.VITE_DEV_TEST_EMAIL?.trim();
  const password = import.meta.env.VITE_DEV_TEST_PASSWORD?.trim();
  if (!email || !password) {
    console.warn(
      '[Quilora dev] VITE_DEV_AUTO_LOGIN is true — add VITE_DEV_TEST_EMAIL and VITE_DEV_TEST_PASSWORD to .env.local (see .env.example).',
    );
    return;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.user) return;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.warn('[Quilora dev] Auto sign-in failed:', error.message);
    return;
  }
  console.info('[Quilora dev] Signed in as', email);
}
