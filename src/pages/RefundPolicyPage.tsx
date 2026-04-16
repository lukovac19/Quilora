import { LegalDocumentPage, type LegalTocItem } from '../components/legal/LegalDocumentPage';
import { RefundPolicyBody } from '../legal/refundPolicyBody';

const TOC: LegalTocItem[] = [
  { id: 'section-1', label: 'Section 1 — Introduction' },
  { id: 'section-2', label: 'Section 2 — Merchant of record' },
  { id: 'section-3', label: 'Section 3 — Default rule (digital services)' },
  { id: 'section-4', label: 'Section 4 — EU / UK right of withdrawal' },
  { id: 'section-5', label: 'Section 5 — Accidental renewals and mistaken charges' },
  { id: 'section-6', label: 'Section 6 — Billing errors and access problems' },
  { id: 'section-7', label: 'Section 7 — Cancellations and unused time' },
  { id: 'section-8', label: 'Section 8 — Chargebacks' },
  { id: 'section-9', label: 'Section 9 — Changes to this Policy' },
  { id: 'section-10', label: 'Section 10 — Contact' },
];

export function RefundPolicyPage() {
  return (
    <LegalDocumentPage
      title="Refund Policy"
      lastUpdatedLine="Last updated: April 17, 2026"
      heroSubtitle="When something goes wrong with a charge, here is how we think about fixes — fairly, predictably, and in plain language."
      toc={TOC}
    >
      <RefundPolicyBody />
    </LegalDocumentPage>
  );
}
