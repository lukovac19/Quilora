import { LegalBulletList, LegalParagraph, LegalSectionCard } from '../components/legal/LegalDocumentPage';

export function TermsOfServiceBody() {
  return (
    <>
      <LegalSectionCard id="section-1" title="1. INTRODUCTION">
        <LegalParagraph>
          These Terms of Service (&quot;Terms&quot;) are a legally binding agreement between you (&quot;you,&quot; &quot;your&quot;) and{' '}
          <strong>[LEGAL ENTITY NAME]</strong> (&quot;Quilora,&quot; &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). These Terms govern your access to and use of our website at [WEBSITE URL], our mobile and web applications, and any related software, content, and study tools (collectively, the &quot;Services&quot;).
        </LegalParagraph>
        <LegalParagraph>
          <strong>By accessing or using the Services, you agree to be bound by these Terms and our Privacy Policy.</strong> If you do not agree, you must not use the Services. If you are using Quilora on behalf of an organization (like a school or company), you represent that you have the authority to bind that entity to these Terms.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-2" title="2. ELIGIBILITY AND AGE RESTRICTIONS">
        <LegalParagraph>By using the Services, you represent that:</LegalParagraph>
        <LegalBulletList>
          <li>
            You are at least <strong>18 years old</strong> (or the age of majority in your jurisdiction); or
          </li>
          <li>If you are a minor (under 18), your parent, legal guardian, or school has reviewed and agreed to these Terms on your behalf.</li>
          <li>Your use of the Services complies with all local academic integrity policies and applicable laws.</li>
        </LegalBulletList>
      </LegalSectionCard>

      <LegalSectionCard id="section-3" title="3. ABOUT THE SERVICES">
        <LegalParagraph>
          Quilora is an <strong>AI-first study application</strong> designed to help users test and reinforce their mastery of reading materials.
        </LegalParagraph>
        <LegalBulletList>
          <li>
            <strong>Supplemental Use Only:</strong> Quilora is a study aid, not a replacement for reading original source materials.
          </li>
          <li>
            <strong>Library Materials:</strong> We may provide access to public domain or Creative Commons works. Your use of these is subject to their specific licenses (e.g., CC BY-SA).
          </li>
        </LegalBulletList>
      </LegalSectionCard>

      <LegalSectionCard id="section-4" title="4. USER ACCOUNTS &amp; SECURITY">
        <LegalParagraph>To access certain features, you must create an account. You agree to:</LegalParagraph>
        <LegalBulletList>
          <li>Provide accurate and current information.</li>
          <li>Maintain the security of your password.</li>
          <li>Accept responsibility for all activities occurring under your account.</li>
          <li>
            Notify us immediately at <strong>[support@quilora.com]</strong> of any unauthorized access.
          </li>
        </LegalBulletList>
      </LegalSectionCard>

      <LegalSectionCard id="section-5" title="5. USER CONTENT &amp; COPYRIGHT">
        <LegalParagraph>&quot;User Content&quot; includes any PDFs, EPUBs, text, or prompts you upload to the Services.</LegalParagraph>
        <LegalParagraph>
          <strong>A. Ownership:</strong> You retain all ownership rights to your User Content.{' '}
          <strong>B. Your Responsibility:</strong> You represent and warrant that you own the content you upload or have the legal right to use it.{' '}
          <strong>You must not upload pirated ebooks, unauthorized scans, or copyrighted publisher materials that you do not have permission to process through AI tools.</strong>{' '}
          <strong>C. License to Quilora:</strong> You grant us a limited, worldwide, royalty-free license to host, store, and process your User Content{' '}
          <strong>solely to provide the Services to you</strong> (e.g., to generate your flashcards or quizzes).{' '}
          <strong>D. AI Training:</strong> We do <strong>not</strong> use your uploaded personal documents or books to train our generalized AI models for other users without your explicit, separate consent.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-6" title="6. GENERATIVE AI &amp; OUTPUTS">
        <LegalParagraph>Quilora uses artificial intelligence to generate study aids, quizzes, and summaries (&quot;Output&quot;).</LegalParagraph>
        <LegalBulletList>
          <li>
            <strong>Accuracy:</strong> AI can &quot;hallucinate&quot; or provide inaccurate info. <strong>Output is provided &quot;as-is.&quot;</strong> You are responsible for verifying the accuracy of any Output before relying on it for exams or academic work.
          </li>
          <li>
            <strong>Ownership of Output:</strong> To the extent permitted by law, you own the specific study materials (like flashcards) generated for you, subject to Quilora&apos;s underlying intellectual property rights in the software.
          </li>
          <li>
            <strong>Non-Uniqueness:</strong> Because AI is probabilistic, other users may receive similar or identical Output for similar prompts or materials.
          </li>
        </LegalBulletList>
      </LegalSectionCard>

      <LegalSectionCard id="section-7" title="7. PROHIBITED CONDUCT">
        <LegalParagraph>You agree not to:</LegalParagraph>
        <LegalBulletList>
          <li>
            Use Quilora to engage in <strong>academic dishonesty</strong> or violate your institution&apos;s honor code.
          </li>
          <li>Upload malicious code or attempt to &quot;jailbreak&quot; or reverse-engineer our AI models.</li>
          <li>Scrape, crawl, or use automated bots to extract content from the platform.</li>
          <li>Circumvent any usage limits or paywalls.</li>
        </LegalBulletList>
      </LegalSectionCard>

      <LegalSectionCard id="section-8" title="8. SUBSCRIPTIONS AND PAYMENTS">
        <LegalBulletList>
          <li>
            <strong>Billing:</strong> Paid plans are billed in advance on a recurring basis (monthly/annually).
          </li>
          <li>
            <strong>Auto-Renewal:</strong> Your subscription will automatically renew unless you cancel it before the end of the current billing cycle.
          </li>
          <li>
            <strong>Cancellations:</strong> You can cancel at any time through your Account Settings. Access will continue until the end of your paid period.
          </li>
          <li>
            <strong>Refunds:</strong> Generally, payments are non-refundable. However, if you believe a charge was made in error, contact us within 7 business days (Monday through Friday).
          </li>
        </LegalBulletList>
      </LegalSectionCard>

      <LegalSectionCard id="section-9" title="9. INTELLECTUAL PROPERTY">
        <LegalParagraph>
          The &quot;Quilora&quot; name, logo, UI design, and underlying algorithms are the exclusive property of [LEGAL ENTITY NAME]. Your use of the Services grants you a limited, non-exclusive license to use these tools—not ownership of them.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-10" title="10. TERMINATION">
        <LegalParagraph>
          We reserve the right to suspend or terminate your account if you violate these Terms, infringe on copyrights, or if your actions pose a legal risk to the platform.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-11" title="11. DISCLAIMERS &amp; LIMITATION OF LIABILITY">
        <LegalParagraph>
          <strong>THE SERVICES ARE PROVIDED &quot;AS IS.&quot;</strong> To the maximum extent permitted by law, Quilora shall not be liable for any indirect, incidental, or consequential damages (including loss of data or grades) arising from your use of the AI tools. Our total liability is limited to the amount you paid us in the past 12 months or <strong>[100 USD]</strong>, whichever is greater.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-12" title="12. DISPUTE RESOLUTION &amp; GOVERNING LAW">
        <LegalBulletList>
          <li>
            <strong>Informal Resolution:</strong> You agree to attempt to resolve any disputes informally by contacting [support@quilora.com].
          </li>
          <li>
            <strong>Governing Law:</strong> These Terms are governed by the laws of <strong>[BOSNIA AND HERZEGOVINA]</strong>.
          </li>
          <li>
            <strong>Jurisdiction:</strong> Any legal action shall be brought in the courts of [CITY/REGION, BOSNIA AND HERZEGOVINA], except where mandatory consumer laws require otherwise.
          </li>
        </LegalBulletList>
      </LegalSectionCard>

      <LegalSectionCard id="section-13" title="13. CONTACT US">
        <LegalParagraph>For questions regarding these Terms, please contact:</LegalParagraph>
        <LegalParagraph>
          <strong>Email:</strong> [support@quilora.com] <strong>Legal Address:</strong> [REGISTERED ADDRESS]
        </LegalParagraph>
      </LegalSectionCard>
    </>
  );
}
