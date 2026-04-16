import { Link } from 'react-router';
import { LegalBulletList, LegalParagraph, LegalSectionCard } from '../components/legal/LegalDocumentPage';

export function RefundPolicyBody() {
  return (
    <>
      <LegalSectionCard id="section-1" title="Section 1 — Introduction">
        <LegalParagraph>
          This Refund Policy explains when Quilora subscriptions and one-time purchases may be refunded, how requests are reviewed, and who processes payments on our behalf. It should be read together with our{' '}
          <Link to="/payments">Payments and Subscriptions Agreement</Link> (full billing terms).
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-2" title="Section 2 — Merchant of record">
        <LegalParagraph>
          Paddle.com (&quot;Paddle&quot;) acts as the merchant of record for Quilora purchases. That means your payment contract is with Paddle, and Paddle processes charges, taxes, and refund transactions where applicable. Quilora provides the software and handles product support questions.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-3" title="Section 3 — Default rule (digital services)">
        <LegalParagraph>
          Quilora delivers digital services and immediate access to software features. Except where the law requires otherwise or an exception below applies, <strong>all fees are non-refundable</strong> once access has been provided.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-4" title="Section 4 — EU / UK right of withdrawal">
        <LegalParagraph>
          If you are a consumer in the European Union or United Kingdom, you may have a statutory cooling-off period for distance contracts. By purchasing digital access that begins immediately, you acknowledge that performance starts at checkout and that your right of withdrawal may be lost once the service has been supplied, as permitted by applicable law.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-5" title="Section 5 — Accidental renewals and mistaken charges">
        <LegalParagraph>
          If a subscription renews and you did not intend to continue, or you believe a charge was made in error, contact us <strong>within 48 hours</strong> of the charge. We review these requests case by case; approval is not guaranteed but we aim to be fair where the facts support a mistake or unintended renewal.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-6" title="Section 6 — Billing errors and access problems">
        <LegalBulletList>
          <li>
            <strong>Billing errors:</strong> If you were charged the wrong amount or twice for the same period, contact us with your receipt details. Verified billing mistakes will be corrected (including refund or credit where appropriate).
          </li>
          <li>
            <strong>Service interruptions:</strong> If technical problems on our side prevent you from accessing paid features for a prolonged period, your exclusive remedy is either restoration of access, account credit, or a refund, at our reasonable discretion.
          </li>
        </LegalBulletList>
      </LegalSectionCard>

      <LegalSectionCard id="section-7" title="Section 7 — Cancellations and unused time">
        <LegalParagraph>
          You may cancel a subscription at any time in account settings or via the link in your Paddle receipt. Cancellation stops future renewals; it does not automatically refund the current billing period unless an exception in this Policy applies. You typically keep paid access until the end of the period you already paid for.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-8" title="Section 8 — Chargebacks">
        <LegalParagraph>
          Before filing a payment dispute or chargeback, please email us so we can investigate. Unfounded disputes may result in suspension of your account until the matter is resolved.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-9" title="Section 9 — Changes to this Policy">
        <LegalParagraph>
          We may update this Refund Policy from time to time. When we do, we will revise the &quot;Last updated&quot; date at the top of this page. Material changes may be announced by email or in-product notice where appropriate.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-10" title="Section 10 — Contact">
        <LegalParagraph>
          Refund and billing questions: <strong>info.quilora.ai@gmail.com</strong>
        </LegalParagraph>
        <LegalParagraph>
          Paddle support (payment and receipt issues):{' '}
          <a href="https://paddle.com/contact">https://paddle.com/contact</a>
        </LegalParagraph>
      </LegalSectionCard>
    </>
  );
}
