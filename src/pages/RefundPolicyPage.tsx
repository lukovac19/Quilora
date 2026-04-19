import { LegalDocumentPage, type LegalTocItem } from '../components/legal/LegalDocumentPage';
import { RefundPolicyBody } from '../legal/refundPolicyBody';
import {
  QUILORA_CONTACT_EMAIL,
  QUILORA_EFFECTIVE_DATE_LINE,
  QUILORA_POSTAL_ADDRESS,
} from '../lib/siteContact';

const TOC: LegalTocItem[] = [
  { id: 'section-1', label: '1. Introduction' },
  { id: 'section-2', label: '2. Dodo Payments (MoR)' },
  { id: 'section-3', label: '3. Subscription refunds' },
  { id: 'section-4', label: '4. Boost Packs' },
  { id: 'section-5', label: '5. Genesis' },
  { id: 'section-6', label: '6. AI credit rollback' },
  { id: 'section-7', label: '7. Consumer rights' },
  { id: 'section-8', label: '8. Disputes' },
  { id: 'section-9', label: '9. Cancellations' },
  { id: 'section-10', label: '10. Changes' },
  { id: 'section-11', label: '11. Contact' },
];

export function RefundPolicyPage() {
  return (
    <LegalDocumentPage
      title="Refund Policy"
      lastUpdatedLine="Last updated: April 18, 2026"
      effectiveDateLine={QUILORA_EFFECTIVE_DATE_LINE}
      heroSubtitle="When something goes wrong with a charge, here is how we think about fixes — fairly, predictably, and in plain language."
      toc={TOC}
      contactFooter={{ email: QUILORA_CONTACT_EMAIL, address: QUILORA_POSTAL_ADDRESS }}
    >
      <RefundPolicyBody />
    </LegalDocumentPage>
  );
}
