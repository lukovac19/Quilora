import type { GroundedAnswerJson } from '../types/groundedAnswer';
import type { TrustSurfaceState } from '../types/groundedAnswer';

export function trustStateFromAnswer(
  g: Pick<GroundedAnswerJson, 'grounded' | 'insufficient_evidence' | 'citations'>,
  mode: 'strict' | 'freestyle_connected' | 'freestyle_standalone',
): TrustSurfaceState {
  if (mode === 'freestyle_standalone') return 'ungrounded';
  if (g.insufficient_evidence || !g.grounded || g.citations.length === 0) return 'insufficient';
  if (g.grounded && g.citations.length > 0) return 'grounded';
  return 'insufficient';
}
