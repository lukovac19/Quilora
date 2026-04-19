import { supabase } from './supabase';

/** EP-02: explicit Bookworm plan confirmation (no checkout). */
export async function markBookwormPlanSelectedForCurrentUser(): Promise<{ ok: boolean; message?: string }> {
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return { ok: false, message: 'Not signed in' };
  const ts = new Date().toISOString();
  const primary = await supabase
    .from('profiles')
    .update({ plan_selection_completed: true, updated_at: ts })
    .eq('id', user.id);
  if (!primary.error) return { ok: true };

  const legacy = await supabase
    .from('profiles')
    .update({ plan_selection: 'bookworm', updated_at: ts })
    .eq('id', user.id);
  if (legacy.error) return { ok: false, message: legacy.error.message };
  return { ok: true };
}
