import type { GroundedCitation, TrustSurfaceState } from './groundedAnswer';

export type AiEvidenceBundle = {
  grounded: boolean;
  confidence: number;
  citations: GroundedCitation[];
  insufficient_evidence: boolean;
  reason: string;
  trust_state: TrustSurfaceState;
};
