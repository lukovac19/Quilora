/**
 * Default Supabase project ref. Override with `VITE_SUPABASE_PROJECT_ID` in `.env.local` if needed.
 *
 * **publicAnonKey** — samo jedno od ovoga (Dashboard → Settings → API):
 * - **anon** / **public** legacy: dugi JWT koji počinje s `eyJ`
 * - **default publishable**: `sb_publishable_...`
 * Nikad **`sb_secret_...`** u ovom fajlu ili u `VITE_SUPABASE_ANON_KEY` (to je samo za server).
 */
export const projectId = 'wzgueofgmkaadxanwpfz';

/** Zalijepi anon JWT ili sb_publishable ovdje, ili koristi `VITE_SUPABASE_ANON_KEY` u `.env.local`. */
export const publicAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6Z3Vlb2ZnbWthYWR4YW53cGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNjM1NzMsImV4cCI6MjA5MTkzOTU3M30.T9YERGuiYBLTLo4qpJTBPdycJ6cWsxX2zFs1MPJLPOs';
