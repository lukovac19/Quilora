import { LegalDocumentPage, type LegalTocItem } from '../components/legal/LegalDocumentPage';
import { PrivacyPolicyBody } from '../legal/privacyPolicyBody';
import {
  QUILORA_CONTACT_EMAIL,
  QUILORA_EFFECTIVE_DATE_LINE,
  QUILORA_POSTAL_ADDRESS,
} from '../lib/siteContact';

const TOC: LegalTocItem[] = [
  { id: 'section-1', label: '1. Introduction' },
  { id: 'section-2', label: '2. Data We Collect' },
  { id: 'section-3', label: '3. Legal Basis (GDPR)' },
  { id: 'section-4', label: '4. How We Use Data' },
  { id: 'section-5', label: '5. AI & Trust Factor' },
  { id: 'section-6', label: '6. Sharing & Third Parties' },
  { id: 'section-7', label: '7. Data Retention' },
  { id: 'section-8', label: '8. Your Rights' },
  { id: 'section-9', label: '9. International Transfers' },
  { id: 'section-10', label: '10. Security' },
  { id: 'section-11', label: '11. Children’s Privacy' },
  { id: 'section-12', label: '12. Cookies' },
  { id: 'section-13', label: '13. Changes' },
  { id: 'section-14', label: '14. Contact' },
];

export function PrivacyPage() {
  return (
    <LegalDocumentPage
      title="Privacy Policy"
      lastUpdatedLine="Last updated: April 18, 2026"
      effectiveDateLine={QUILORA_EFFECTIVE_DATE_LINE}
      heroSubtitle="We collect only what we need to run Quilora well, and we are careful with what you trust us with."
      toc={TOC}
      contactFooter={{ email: QUILORA_CONTACT_EMAIL, address: QUILORA_POSTAL_ADDRESS }}
    >
      <PrivacyPolicyBody />
    </LegalDocumentPage>
  );
}
