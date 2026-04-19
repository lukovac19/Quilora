/**
 * Creates a Quilora test user via Supabase Auth (anon signup API).
 * Run from repo root: node scripts/create-test-user.mjs
 *
 * Uses VITE_SUPABASE_ANON_KEY from the environment if set, otherwise reads publicAnonKey from info.tsx.
 * If your project requires email confirmation, either:
 * - confirm the user in Supabase Dashboard → Authentication → Users, or
 * - temporarily disable "Confirm email" under Authentication → Providers → Email.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const infoPath = path.join(__dirname, '../src/utils/supabase/info.tsx');
const info = fs.readFileSync(infoPath, 'utf8');
const projectId = info.match(/export const projectId = ['"]([^'"]+)['"]/)?.[1];
const embeddedAnon = info.match(/export const publicAnonKey = ['"]([^'"]*)['"]/)?.[1] ?? '';
let anon = process.env.VITE_SUPABASE_ANON_KEY?.trim() || embeddedAnon;
if (anon.startsWith('sb_secret_')) {
  console.error(
    'Ne koristi sb_secret_* u skripti — to je server ključ. Postavi VITE_SUPABASE_ANON_KEY na anon (eyJ…) ili sb_publishable_*.',
  );
  process.exit(1);
}

if (!projectId) {
  console.error('Could not read projectId from src/utils/supabase/info.tsx');
  process.exit(1);
}
if (!anon) {
  console.error(
    'Missing anon key. Set VITE_SUPABASE_ANON_KEY in the environment or paste anon / sb_publishable into publicAnonKey in info.tsx.',
  );
  process.exit(1);
}

const email = process.argv[2] || 'quilora.local.test@example.com';
const password = process.argv[3] || 'TestQuilora9A';

const url = `https://${projectId}.supabase.co/auth/v1/signup`;
const res = await fetch(url, {
  method: 'POST',
  headers: {
    apikey: anon,
    Authorization: `Bearer ${anon}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ email, password }),
});

const body = await res.text();
let json;
try {
  json = JSON.parse(body);
} catch {
  json = body;
}

console.log('HTTP', res.status);
console.log(JSON.stringify(json, null, 2));

if (!res.ok) {
  process.exit(1);
}

console.log('\n--- Sign in at /auth?mode=login ---');
console.log('Email:', email);
console.log('Password:', password);
if (!json?.session) {
  console.log('\n(No session returned — email confirmation may be required.)');
}
console.log('\n--- Optional: auto sign-in during `npm run dev` ---');
console.log('Add to .env.local (restart Vite):');
console.log(`VITE_DEV_AUTO_LOGIN=true`);
console.log(`VITE_DEV_TEST_EMAIL=${JSON.stringify(email)}`);
console.log(`VITE_DEV_TEST_PASSWORD=${JSON.stringify(password)}`);
