import { LegalDocumentPage, type LegalTocItem } from '../components/legal/LegalDocumentPage';
import { TermsOfServiceBody } from '../legal/termsOfServiceBody';
import {
  QUILORA_CONTACT_EMAIL,
  QUILORA_EFFECTIVE_DATE_LINE,
  QUILORA_POSTAL_ADDRESS,
} from '../lib/siteContact';

const TOC: LegalTocItem[] = [
  { id: 'section-1', label: '1. Introduction and Agreement' },
  { id: 'section-2', label: '2. Eligibility' },
  { id: 'section-3', label: '3. User Accounts' },
  { id: 'section-4', label: '4. User Content and IP' },
  { id: 'section-5', label: '5. Copyright & DMCA' },
  { id: 'section-6', label: '6. AI-Generated Outputs' },
  { id: 'section-7', label: '7. Prohibited Use' },
  { id: 'section-8', label: '8. Subscriptions & Credits' },
  { id: 'section-9', label: '9. Refund Policy' },
  { id: 'section-10', label: '10. Suspension & Termination' },
  { id: 'section-11', label: '11. Disclaimers & Liability' },
  { id: 'section-12', label: '12. Governing Law' },
  { id: 'section-13', label: '13. General Provisions' },
  { id: 'section-14', label: '14. Contact' },
];

export function TermsPage() {
  return (
    <LegalDocumentPage
      title="Terms & Conditions"
      lastUpdatedLine="Last updated: April 18, 2026"
      effectiveDateLine={QUILORA_EFFECTIVE_DATE_LINE}
      heroSubtitle="The plain-English version lives in the product — this page is the formal agreement that keeps everyone safe."
      toc={TOC}
      contactFooter={{ email: QUILORA_CONTACT_EMAIL, address: QUILORA_POSTAL_ADDRESS }}
      articleInnerClassName="gap-8 sm:gap-10"
    >
      <TermsOfServiceBody />
    </LegalDocumentPage>
  );
}
