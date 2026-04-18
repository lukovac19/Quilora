import { Link } from 'react-router';
import { LegalBulletList, LegalParagraph, LegalSectionCard } from '../components/legal/LegalDocumentPage';
import { QUILORA_CONTACT_EMAIL } from '../lib/siteContact';

const mail = `mailto:${QUILORA_CONTACT_EMAIL}`;

export function TermsOfServiceBody() {
  return (
    <>
      <LegalSectionCard id="section-1" title="1. Introduction and Agreement">
        <LegalParagraph>
          These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between you (&quot;User,&quot; &quot;you,&quot; &quot;your&quot;) and Quilora (&quot;Quilora,&quot; &quot;we,&quot; &quot;us,&quot; &quot;our&quot;), operated from Nerkeza Smailagića 11, Sarajevo, Bosnia and Herzegovina.
        </LegalParagraph>
        <LegalParagraph>
          Quilora is an AI-powered reading and knowledge-mapping platform that helps you build, connect, and validate deep understanding across your reading list, from fiction and narratives to any form of text. These Terms govern your access to and use of{' '}
          <a href="https://quilora.app">https://quilora.app</a>, including all AI-powered analytical features, canvas tools, subscription services, credit systems, and related functionality (collectively, the &quot;Services&quot;). Our order process is conducted by our online reseller Polar. Polar is the Merchant of Record for all our orders.
        </LegalParagraph>
        <LegalParagraph>
          By registering an account, completing a purchase through our payment processor, or accessing any part of the Services, you confirm that you have read, understood, and agree to be bound by these Terms and our{' '}
          <Link to="/privacy">Privacy Policy</Link>, which is incorporated herein by reference.
        </LegalParagraph>
        <LegalParagraph>If you do not agree to these Terms, you must not access or use the Services.</LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-2" title="2. Eligibility">
        <LegalParagraph>To use the Services, you must:</LegalParagraph>
        <LegalBulletList>
          <li>Be at least 18 years of age, OR</li>
          <li>Be at least 13 years of age and have obtained verifiable written parental or guardian consent prior to registration;</li>
          <li>Have the legal capacity to enter into a binding agreement in your jurisdiction;</li>
          <li>Not be prohibited from accessing the Services under applicable law.</li>
        </LegalBulletList>
        <LegalParagraph>
          By creating an account, you represent and warrant that you meet all eligibility requirements. We reserve the right to terminate accounts of users who misrepresent their eligibility.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-3" title="3. User Accounts">
        <LegalParagraph>
          Account registration is completed through our third-party payment processor (Polar), which acts as Merchant of Record for all transactions. Your account is created and activated only upon successful payment confirmation via Polar&apos;s webhook system.
        </LegalParagraph>
        <LegalParagraph>You are responsible for:</LegalParagraph>
        <LegalBulletList>
          <li>Maintaining the confidentiality of your login credentials;</li>
          <li>All activity that occurs under your account;</li>
          <li>
            Notifying us immediately at{' '}
            <a href={mail}>
              <strong>{QUILORA_CONTACT_EMAIL}</strong>
            </a>{' '}
            of any unauthorized access or security breach.
          </li>
        </LegalBulletList>
        <LegalParagraph>
          We reserve the right to suspend or terminate accounts that are used in violation of these Terms, used for fraudulent activity, or associated with chargebacks or disputed transactions without legitimate basis.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-4" title="4. User Content and Intellectual Property">
        <LegalParagraph>
          <strong>4.1 Your Ownership</strong> — You retain full ownership of all content you upload, paste, or otherwise submit to the Services, including text, PDF files, EPUB files, and any other materials (&quot;User Content&quot;). Quilora does not claim ownership of your User Content.
        </LegalParagraph>
        <LegalParagraph>
          <strong>4.2 Your Responsibility for Uploaded Content</strong> — By uploading or submitting any content to the Services, you represent and warrant that: you are the lawful owner of the content, OR you have obtained all necessary licenses, permissions, rights, and consents from the copyright holder or other rights holder to upload, process, and use the content in connection with the Services; your content does not infringe, misappropriate, or violate any third-party intellectual property rights, privacy rights, publicity rights, or any other applicable rights; your content does not violate any applicable law or regulation; and you have the right to grant Quilora the limited license described below.
        </LegalParagraph>
        <LegalParagraph>
          Quilora is a software tool — it does not supply, resell, or distribute copyrighted texts to users. The Services process only content that users themselves upload or activate from the CC Library. You assume sole responsibility for ensuring that any content you upload — including books, documents, papers, and other works — is either owned by you, in the public domain, or that you hold a valid license permitting its upload and AI-assisted processing. Uploading copyrighted material without authorization may violate applicable copyright law and these Terms.
        </LegalParagraph>
        <LegalParagraph>
          <strong>4.3 License Grant to Quilora</strong> — By submitting User Content, you grant Quilora a limited, non-exclusive, royalty-free, worldwide license to process, store, chunk, embed, and retrieve your content solely for the purpose of providing the Services to you. This license terminates when you delete your content or close your account, subject to our data retention practices described in the{' '}
          <Link to="/privacy">Privacy Policy</Link>.
        </LegalParagraph>
        <LegalParagraph>
          Quilora does not use your User Content to train AI models, sell your content to third parties, or make your content available to other users without your explicit consent.
        </LegalParagraph>
        <LegalParagraph>
          <strong>4.4 Creative Commons Library</strong> — Quilora provides access to a catalog of public domain works and works licensed under Creative Commons licenses that permit commercial use (CC0, CC-BY, CC-BY-SA, or equivalent) (the &quot;CC Library&quot;). Activating a CC Library title enables AI-assisted processing of that text within the Services. All CC Library materials are sourced exclusively from works whose licenses permit commercial use and AI-assisted processing. Users may not circumvent the CC Library&apos;s activation mechanism to access or redistribute these texts outside the Services.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-5" title="5. Copyright Policy and DMCA Compliance">
        <LegalParagraph>
          <strong>5.1 Quilora&apos;s Commitment</strong> — Quilora respects intellectual property rights and expects users to do the same. We will respond to clear notices of alleged copyright infringement submitted in accordance with the Digital Millennium Copyright Act (&quot;DMCA&quot;) and applicable international copyright law.
        </LegalParagraph>
        <LegalParagraph>
          <strong>5.2 DMCA Takedown Procedure</strong> — If you believe that your copyrighted work has been uploaded to the Services without authorization, please submit a written notice to our designated agent at: Email:{' '}
          <a href={mail}>{QUILORA_CONTACT_EMAIL}</a>; Postal Address: Nerkeza Smailagića 11, Sarajevo, Bosnia and Herzegovina. Your notice must include all of the following: a physical or electronic signature of a person authorized to act on behalf of the copyright owner; identification of the copyrighted work claimed to have been infringed, or if multiple works are covered by a single notification, a representative list of such works; identification of the material that is claimed to be infringing and information reasonably sufficient to permit us to locate it; your name, address, telephone number, and email address; a statement that you have a good faith belief that use of the material is not authorized by the copyright owner, its agent, or the law; and a statement that the information in the notification is accurate, and under penalty of perjury, that you are authorized to act on behalf of the owner of the exclusive right allegedly infringed.
        </LegalParagraph>
        <LegalParagraph>
          <strong>5.3 Counter-Notification</strong> — If you believe your content was removed in error, you may submit a counter-notification to the same address above, including: your contact information, identification of the removed material and its prior location, a statement under penalty of perjury that the material was removed by mistake or misidentification, and your consent to the jurisdiction of the relevant court.
        </LegalParagraph>
        <LegalParagraph>
          <strong>5.4 Repeat Infringers</strong> — Quilora reserves the right to terminate, in appropriate circumstances, accounts of users who are determined to be repeat infringers.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-6" title="6. AI-Generated Outputs">
        <LegalParagraph>
          Quilora uses large language models and retrieval-augmented generation (RAG) to produce analytical outputs including summaries, thematic analyses, character breakdowns, evidence anchors, comprehension feedback, and other AI-generated content (&quot;AI Outputs&quot;).
        </LegalParagraph>
        <LegalParagraph>You acknowledge and agree that:</LegalParagraph>
        <LegalBulletList>
          <li>AI Outputs are generated by automated systems and may contain errors, inaccuracies, or omissions, even when grounded in source material;</li>
          <li>AI Outputs do not constitute professional, legal, medical, academic, or other expert advice;</li>
          <li>You are solely responsible for verifying the accuracy of AI Outputs before relying on them for any purpose;</li>
          <li>
            Quilora&apos;s Trust Factor system grounds AI Outputs in your uploaded source material, but this does not guarantee factual accuracy or completeness;
          </li>
          <li>You own the AI Outputs generated from your content and credits, subject to any underlying intellectual property rights of third parties in the source material;</li>
          <li>
            Verbatim text passages surfaced by Evidence features are extracted from your own uploaded content for personal study purposes. You are solely responsible for ensuring that any downstream use of extracted verbatim passages — including reproduction, publication, or distribution — complies with applicable copyright law.
          </li>
        </LegalBulletList>
      </LegalSectionCard>

      <LegalSectionCard id="section-7" title="7. Prohibited Use">
        <LegalParagraph>You agree not to use the Services to:</LegalParagraph>
        <LegalBulletList>
          <li>Upload, transmit, or process any content that infringes a third party&apos;s intellectual property rights, including uploading copyrighted works without authorization;</li>
          <li>Engage in academic dishonesty, impersonation, or misrepresentation using AI Outputs;</li>
          <li>Attempt to reverse-engineer, scrape, copy, or extract Quilora&apos;s AI models, prompts, retrieval systems, or proprietary algorithms;</li>
          <li>Generate content that is defamatory, harassing, threatening, obscene, or unlawful;</li>
          <li>Attempt to bypass credit deduction systems, payment gates, tier restrictions, or access controls;</li>
          <li>Share account credentials, resell access, or allow multiple users to share a single account;</li>
          <li>Use the Services in any way that violates applicable local, national, or international law or regulation;</li>
          <li>Introduce malware, viruses, or any disruptive code into the Services.</li>
        </LegalBulletList>
        <LegalParagraph>
          Violations of this section may result in immediate account suspension or termination, forfeiture of unused credits, and potential legal action.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-8" title="8. Subscriptions, Payments, and Credits">
        <LegalParagraph>
          <strong>8.1 Payment Processor and Merchant of Record</strong> — All payments are processed exclusively through Polar, which acts as the Merchant of Record and authorized reseller for all Quilora purchases. By completing a purchase, you also agree to Polar&apos;s terms of service and privacy policy, available at{' '}
          <a href="https://polar.sh/legal/terms">polar.sh</a>. Polar provides all customer payment inquiries and handles payment-related returns.
        </LegalParagraph>
        <LegalParagraph>
          <strong>8.2 Subscription Tiers</strong> — Quilora offers the following subscription plans:
        </LegalParagraph>
        <LegalBulletList>
          <li>
            <strong>Bookworm ($6.00/month):</strong> 800 monthly AI credits, up to 5 active workspaces, no credit rollover. First month available at $4.80 (20% introductory discount).
          </li>
          <li>
            <strong>Sage ($16.00/month):</strong> 2,500 monthly AI credits, unlimited workspaces, credit rollover enabled. First month available at $12.80 (20% introductory discount).
          </li>
          <li>
            <strong>Genesis Account ($80 or $119, one-time, limited to first 200 purchasers):</strong> Lifetime perks including 15,000 legacy credits, Bookworm-tier access at no recurring cost, 20% lifetime discount on Sage+, and a permanent Genesis identity badge.
          </li>
        </LegalBulletList>
        <LegalParagraph>
          <strong>8.3 Credits</strong> — Credits are the in-app currency consumed exclusively by AI-powered actions within the Services. Credits are not redeemable for cash and have no monetary value outside the Services. Sage users accumulate unused credits month-over-month with no expiry. Bookworm users&apos; credits reset each billing cycle. Boost Packs (200 credits for $1.99) are available to all subscription tiers at any time and are applied to your balance within 30 seconds of purchase.
        </LegalParagraph>
        <LegalParagraph>
          <strong>8.4 Auto-Renewal</strong> — Bookworm and Sage subscriptions are auto-renewing. Your payment method will be charged at the start of each billing cycle unless you cancel prior to the renewal date. You can cancel at any time through your account settings. Cancellation takes effect at the end of the current billing period.
        </LegalParagraph>
        <LegalParagraph>
          <strong>8.5 Price Changes</strong> — We reserve the right to change subscription pricing with at least 14 days&apos; advance notice to active subscribers. Continued use after a price change constitutes acceptance. Genesis Account perks are permanent and not subject to price changes.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-9" title="9. Refund Policy">
        <LegalParagraph>
          All refund requests are subject to Polar&apos;s refund policies as Merchant of Record, in addition to the terms below. Full billing and refund details appear in our{' '}
          <Link to="/payments">Payments and Subscriptions Agreement</Link> and <Link to="/refund-policy">Refund Policy</Link>.
        </LegalParagraph>
        <LegalBulletList>
          <li>
            <strong>Subscriptions:</strong> You may request a refund within 48 hours of a charge if you believe it was made in error and the Services were not actively used during that period. Email{' '}
            <a href={mail}>{QUILORA_CONTACT_EMAIL}</a> with your Polar order number.
          </li>
          <li>
            <strong>Boost Packs:</strong> Non-refundable once credits have been applied to your account.
          </li>
          <li>
            <strong>Genesis Accounts:</strong> Non-refundable, given the limited-slot, lifetime nature of the offering. This is disclosed clearly at the time of purchase.
          </li>
          <li>
            <strong>Failed AI call rollbacks:</strong> If an AI action fails due to a timeout, API error, or partial response, credits are automatically rolled back. No manual request is needed.
          </li>
        </LegalBulletList>
        <LegalParagraph>
          Approved refunds are processed by Polar and may take 5–10 business days to appear on your statement. Nothing in this policy limits your statutory rights under applicable consumer protection law.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-10" title="10. Suspension and Termination">
        <LegalParagraph>We reserve the right to suspend or terminate your account, with or without notice, if:</LegalParagraph>
        <LegalBulletList>
          <li>You breach any provision of these Terms;</li>
          <li>We receive a valid DMCA takedown notice relating to your uploaded content;</li>
          <li>You engage in fraudulent, abusive, or illegal activity;</li>
          <li>Your account is associated with repeated chargebacks or payment disputes without legitimate basis.</li>
        </LegalBulletList>
        <LegalParagraph>
          Upon termination for cause, your access is immediately revoked and unused credits are forfeited. If we terminate your account without cause, we will provide a pro-rated refund for the unused portion of your current subscription period.
        </LegalParagraph>
        <LegalParagraph>
          You may close your account at any time by cancelling your subscription and emailing{' '}
          <a href={mail}>{QUILORA_CONTACT_EMAIL}</a>.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-11" title="11. Disclaimer of Warranties and Limitation of Liability">
        <LegalParagraph>
          <strong>11.1 Disclaimer</strong> — THE SERVICES ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR ACCURACY OF AI OUTPUTS. QUILORA DOES NOT WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED OR ERROR-FREE.
        </LegalParagraph>
        <LegalParagraph>
          <strong>11.2 Limitation of Liability</strong> — TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, QUILORA&apos;S TOTAL CUMULATIVE LIABILITY TO YOU FOR ANY CLAIMS ARISING OUT OF OR RELATED TO THESE TERMS OR THE SERVICES SHALL NOT EXCEED THE GREATER OF (A) THE TOTAL FEES PAID BY YOU TO QUILORA IN THE SIX MONTHS PRECEDING THE CLAIM, OR (B) USD $50.00. IN NO EVENT SHALL QUILORA BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, GOODWILL, OR OTHER INTANGIBLE LOSSES, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
        </LegalParagraph>
        <LegalParagraph>
          <strong>11.3 Indemnification</strong> — You agree to indemnify, defend, and hold harmless Quilora and its operators from any claims, liabilities, damages, losses, and expenses (including reasonable legal fees) arising from: (a) your use of the Services; (b) your User Content, including any claim that it infringes a third party&apos;s intellectual property rights; (c) your violation of these Terms; or (d) your violation of any applicable law.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-12" title="12. Governing Law and Dispute Resolution">
        <LegalParagraph>
          These Terms are governed by the laws of Bosnia and Herzegovina, without regard to conflict of law principles.
        </LegalParagraph>
        <LegalParagraph>
          For users in the European Union: Nothing in these Terms limits your rights under applicable EU consumer protection law or GDPR.
        </LegalParagraph>
        <LegalParagraph>
          Disputes shall first be attempted to be resolved through good-faith negotiation by contacting{' '}
          <a href={mail}>{QUILORA_CONTACT_EMAIL}</a>. If unresolved within 30 days, disputes shall be subject to the exclusive jurisdiction of the courts of Sarajevo, Bosnia and Herzegovina.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-13" title="13. General Provisions">
        <LegalBulletList>
          <li>
            <strong>Entire Agreement:</strong> These Terms, together with the <Link to="/privacy">Privacy Policy</Link> and <Link to="/payments">Payments Agreement</Link>, constitute the entire agreement between you and Quilora regarding the Services.
          </li>
          <li>
            <strong>Severability:</strong> If any provision is found unenforceable, the remaining provisions continue in full force.
          </li>
          <li>
            <strong>Waiver:</strong> Failure to enforce any right under these Terms does not constitute a waiver of that right.
          </li>
          <li>
            <strong>Assignment:</strong> You may not assign your rights without our prior written consent. We may assign our rights freely.
          </li>
          <li>
            <strong>Changes to Terms:</strong> Material changes will be communicated via email or in-app notice at least 14 days before taking effect. Continued use constitutes acceptance.
          </li>
        </LegalBulletList>
      </LegalSectionCard>

      <LegalSectionCard id="section-14" title="14. Contact">
        <LegalParagraph>For questions, notices, or complaints related to these Terms:</LegalParagraph>
        <LegalParagraph>
          <strong>Email:</strong>{' '}
          <a href={mail}>{QUILORA_CONTACT_EMAIL}</a>
        </LegalParagraph>
        <LegalParagraph>
          <strong>Address:</strong> Nerkeza Smailagića 11, Sarajevo, Bosnia and Herzegovina
        </LegalParagraph>
        <LegalParagraph>
          <strong>Website:</strong>{' '}
          <a href="https://quilora.app">https://quilora.app</a>
        </LegalParagraph>
      </LegalSectionCard>
    </>
  );
}
