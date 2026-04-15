import { LegalDocumentPage, type LegalTocItem } from '../components/legal/LegalDocumentPage';
import { PrivacyPolicyBody } from '../legal/privacyPolicyBody';

const TOC: LegalTocItem[] = [
  { id: 'section-1', label: 'Section 1 — Introduction' },
  { id: 'section-2', label: 'Section 2 — Information We Collect' },
  { id: 'section-3', label: 'Section 3 — How We Use Your Information' },
  { id: 'section-4', label: 'Section 4 — Sharing Your Information' },
  { id: 'section-5', label: 'Section 5 — Data Retention' },
  { id: 'section-6', label: 'Section 6 — Your Rights' },
  { id: 'section-7', label: 'Section 7 — Cookies' },
  { id: 'section-8', label: 'Section 8 — Security' },
  { id: 'section-9', label: 'Section 9 — Changes to This Policy' },
  { id: 'section-10', label: 'Section 10 — Contact Us' },
];

export function PrivacyPage() {
  return (
    <LegalDocumentPage
      title="Privacy Policy"
      lastUpdatedLine="Last updated: April 14, 2026"
      heroSubtitle="We collect only what we need to run Quilora well, and we are careful with what you trust us with."
      toc={TOC}
    >
      <PrivacyPolicyBody />
    </LegalDocumentPage>
  );
}
