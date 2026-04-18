import { supabase } from './supabase';

/** EP-02: explicit Bookworm plan confirmation (no paid checkout). */
export async function markBookwormPlanSelectedForCurrentUser(): Promise<{ ok: boolean; message?: string }> {
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return { ok: false, message: 'Not signed in' };
  const { error } = await supabase
    .from('profiles')
    .update({ plan_selection_completed: true, updated_at: new Date().toISOString() })
    .eq('id', user.id);
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}
