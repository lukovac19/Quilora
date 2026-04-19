import { supabase } from './supabase';

const ts = () => new Date().toISOString();

/** Prefer Quilora columns; fall back to legacy `display_name` if `full_name` is not writable. */
export async function updateProfileDisplayName(userId: string, name: string): Promise<{ ok: boolean; message?: string }> {
  const trimmed = name.trim();
  const primary = await supabase
    .from('profiles')
    .update({ full_name: trimmed, updated_at: ts() })
    .eq('id', userId);
  if (!primary.error) return { ok: true };
  const legacy = await supabase
    .from('profiles')
    .update({ display_name: trimmed, updated_at: ts() })
    .eq('id', userId);
  if (!legacy.error) return { ok: true };
  return { ok: false, message: legacy.error.message };
}

/** Onboarding: set name + streak goal when columns exist. */
export async function applyOnboardingProfilePatch(
  userId: string,
  displayName: string,
): Promise<{ ok: boolean; message?: string }> {
  const trimmed = displayName.trim();
  const primary = await supabase
    .from('profiles')
    .update({ full_name: trimmed, streak_goal: 1, updated_at: ts() })
    .eq('id', userId);
  if (!primary.error) return { ok: true };
  const legacy = await supabase
    .from('profiles')
    .update({ display_name: trimmed, updated_at: ts() })
    .eq('id', userId);
  if (!legacy.error) return { ok: true };
  return { ok: false, message: legacy.error.message };
}
