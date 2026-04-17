import { LegalDocumentPage, type LegalTocItem } from '../components/legal/LegalDocumentPage';
import { TermsOfServiceBody } from '../legal/termsOfServiceBody';
import {
  QUILORA_CONTACT_EMAIL,
  QUILORA_EFFECTIVE_DATE_LINE,
  QUILORA_POSTAL_ADDRESS,
} from '../lib/siteContact';

const TOC: LegalTocItem[] = [
  { id: 'section-1', label: '1. INTRODUCTION' },
  { id: 'section-2', label: '2. ELIGIBILITY AND AGE RESTRICTIONS' },
  { id: 'section-3', label: '3. ABOUT THE SERVICES' },
  { id: 'section-4', label: '4. USER ACCOUNTS & SECURITY' },
  { id: 'section-5', label: '5. USER CONTENT & COPYRIGHT' },
  { id: 'section-6', label: '6. GENERATIVE AI & OUTPUTS' },
  { id: 'section-7', label: '7. PROHIBITED CONDUCT' },
  { id: 'section-8', label: '8. SUBSCRIPTIONS AND PAYMENTS' },
  { id: 'section-9', label: '9. INTELLECTUAL PROPERTY' },
  { id: 'section-10', label: '10. TERMINATION' },
  { id: 'section-11', label: '11. DISCLAIMERS & LIMITATION OF LIABILITY' },
  { id: 'section-12', label: '12. DISPUTE RESOLUTION & GOVERNING LAW' },
  { id: 'section-13', label: '13. CONTACT US' },
];

export function TermsPage() {
  return (
    <LegalDocumentPage
      title="Terms & Conditions"
      lastUpdatedLine="Last updated: April 17, 2026"
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
