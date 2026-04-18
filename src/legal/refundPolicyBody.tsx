import { Link } from 'react-router';
import { LegalBulletList, LegalParagraph, LegalSectionCard } from '../components/legal/LegalDocumentPage';
import { QUILORA_CONTACT_EMAIL } from '../lib/siteContact';

const mail = `mailto:${QUILORA_CONTACT_EMAIL}`;

export function RefundPolicyBody() {
  return (
    <>
      <LegalSectionCard id="section-1" title="1. Introduction">
        <LegalParagraph>
          This Refund Policy explains how subscription charges, Boost Pack purchases, and Genesis Account purchases may be refunded, and how failed AI actions affect credits. It should be read together with our{' '}
          <Link to="/payments">Payments and Subscriptions Agreement</Link> and <Link to="/terms">Terms of Service</Link>. Our order process is conducted by our online reseller Polar, which is the Merchant of Record for all orders and handles payment-related returns.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-2" title="2. Polar as Merchant of Record">
        <LegalParagraph>
          Quilora&apos;s refund policy complies with Polar&apos;s reseller terms and applicable consumer protection law. Approved refunds are processed by Polar and may take 5–10 business days to appear on your statement.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-3" title="3. Subscription refunds">
        <LegalParagraph>
          Refund requests for Bookworm or Sage subscription charges must be submitted within <strong>48 hours</strong> of the billing date and must not involve active use of the Services during that billing cycle. Submit requests to{' '}
          <a href={mail} className="font-semibold text-[#7bbdf3] underline underline-offset-2 hover:text-white">
            {QUILORA_CONTACT_EMAIL}
          </a>{' '}
          with your Polar order number and a description of the issue.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-4" title="4. Boost Pack refunds">
        <LegalParagraph>
          Boost Pack purchases are <strong>non-refundable</strong> once AI credits have been applied to your account balance.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-5" title="5. Genesis Account refunds">
        <LegalParagraph>
          Genesis Account purchases are <strong>non-refundable</strong>, given the limited-slot, lifetime perk nature of the offering. This is clearly disclosed at the time of purchase.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-6" title="6. Failed AI call credit rollback">
        <LegalParagraph>
          Quilora uses a deduct-then-confirm credit system. If an AI action fails due to a timeout, API error, or partial response, credits are automatically rolled back to your account. No refund request is required — the rollback is immediate and automatic.
        </LegalParagraph>
        <LegalParagraph>
          Low-quality but complete AI outputs are not automatically refunded; users may report them via the in-app &quot;Report this response&quot; mechanism.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-7" title="7. Consumer protection rights">
        <LegalParagraph>
          Nothing in this Refund Policy limits your statutory rights under applicable consumer protection law. EU/EEA consumers may have additional rights under EU consumer law, including rights under Directive 2011/83/EU on consumer rights.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-8" title="8. Billing disputes and chargebacks">
        <LegalParagraph>
          If you believe you have been incorrectly charged, please contact us first at{' '}
          <a href={mail} className="font-semibold text-[#7bbdf3] underline underline-offset-2 hover:text-white">
            {QUILORA_CONTACT_EMAIL}
          </a>{' '}
          before initiating a chargeback with your bank or card issuer. We will investigate and resolve valid billing disputes promptly.
        </LegalParagraph>
        <LegalParagraph>
          Initiating a chargeback without first contacting Quilora may result in account suspension. We reserve the right to contest chargebacks where the charge was valid and the Services were used.
        </LegalParagraph>
        <LegalParagraph>
          For disputes related to the payment transaction itself, you may also contact Polar&apos;s support as Merchant of Record:{' '}
          <a href="https://polar.sh/docs" className="font-semibold text-[#7bbdf3] underline underline-offset-2 hover:text-white">
            https://polar.sh/docs
          </a>
          .
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-9" title="9. Cancellations and unused credits">
        <LegalParagraph>
          You may cancel your subscription at any time through your account settings. Cancellation takes effect at the end of your current billing period — you retain access until that date. Unused credits are generally forfeited upon account closure and are not refundable except where required by law or an exception in this Policy applies.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-10" title="10. Changes to this Policy">
        <LegalParagraph>
          We may update this Refund Policy from time to time. When we do, we will revise the &quot;Last updated&quot; date at the top of this page. Material changes may be announced by email or in-product notice where appropriate.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-11" title="11. Contact">
        <LegalParagraph>
          Refund and billing questions:{' '}
          <a href={mail} className="font-semibold text-[#7bbdf3] underline underline-offset-2 hover:text-white">
            {QUILORA_CONTACT_EMAIL}
          </a>
        </LegalParagraph>
        <LegalParagraph>
          <strong>Postal address:</strong> Nerkeza Smailagića 11, Sarajevo, Bosnia and Herzegovina
        </LegalParagraph>
      </LegalSectionCard>
    </>
  );
}
