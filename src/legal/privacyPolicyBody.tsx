import { LegalParagraph, LegalSectionCard } from '../components/legal/LegalDocumentPage';

export function PrivacyPolicyBody() {
  return (
    <>
      <LegalSectionCard id="section-1" title="Section 1 — Introduction">
        <LegalParagraph>
          Quilora (&quot;we,&quot; &quot;us&quot;) respects your privacy. This Policy explains what we collect, why we collect it, and the choices you have. If anything here is unclear, reach out—we are happy to talk it through in plain language.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-2" title="Section 2 — Information We Collect">
        <LegalParagraph>We collect information in a few straightforward categories:</LegalParagraph>
        <ul className="ml-5 list-disc space-y-2 pl-1 text-base leading-[1.75] text-white/75 marker:text-[#5b9bd6] sm:ml-6">
          <li>
            <strong className="text-white/95">Account data:</strong> such as email, display name, and authentication identifiers from our sign-in provider.
          </li>
          <li>
            <strong className="text-white/95">Usage &amp; device data:</strong> such as approximate location (from IP), browser type, and product interactions needed to run and secure the service.
          </li>
          <li>
            <strong className="text-white/95">Content you upload:</strong> such as PDFs or text you choose to analyze inside Quilora, plus related metadata needed to display and process that content.
          </li>
        </ul>
      </LegalSectionCard>

      <LegalSectionCard id="section-3" title="Section 3 — How We Use Your Information">
        <LegalParagraph>We use information to provide Quilora, personalize your experience, keep accounts secure, fix bugs, comply with law, and communicate important service updates. We do not sell your personal information.</LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-4" title="Section 4 — Sharing Your Information">
        <LegalParagraph>
          We share information with vendors who help us operate the product (for example, hosting, authentication, payments, and AI inference), strictly under contracts that limit their use. When you pay, our merchant of record (Paddle) processes payment details—we do not store your full card number on Quilora servers.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-5" title="Section 5 — Data Retention">
        <LegalParagraph>
          We retain account and usage data for as long as your account is active and for a reasonable period afterward for backups, security, and legal compliance. You can request deletion of your account subject to limited exceptions (for example, records we must keep for tax or fraud-prevention reasons).
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-6" title="Section 6 — Your Rights">
        <LegalParagraph>
          Depending on where you live, you may have rights to access, correct, export, or delete personal data, and to object to or restrict certain processing. Contact us and we will respond within a reasonable timeframe. If you are in the EU/UK, you may also lodge a complaint with your local supervisory authority.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-7" title="Section 7 — Cookies">
        <LegalParagraph>
          We use cookies and similar technologies for essential functions (like keeping you signed in) and, where allowed, to understand product usage. You can control non-essential cookies through your browser settings; some features may not work if essential cookies are blocked.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-8" title="Section 8 — Security">
        <LegalParagraph>
          We use industry-standard safeguards designed to protect personal data. No method of transmission over the internet is 100% secure, but we work continuously to reduce risk and to respond quickly if something goes wrong.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-9" title="Section 9 — Changes to This Policy">
        <LegalParagraph>
          We may update this Policy from time to time. When we do, we will revise the &quot;Last updated&quot; date at the top of this page and, for material changes, provide additional notice (such as an in-app message or email).
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-10" title="Section 10 — Contact Us">
        <LegalParagraph>
          Questions about privacy? Email <strong>info.quilora.ai@gmail.com</strong> and we will help.
        </LegalParagraph>
      </LegalSectionCard>
    </>
  );
}
