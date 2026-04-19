import { Link } from 'react-router';
import { LegalBulletList, LegalParagraph, LegalSectionCard } from '../components/legal/LegalDocumentPage';
import { QUILORA_CONTACT_EMAIL } from '../lib/siteContact';

const mail = `mailto:${QUILORA_CONTACT_EMAIL}`;
const linkClass = 'font-semibold text-[#7bbdf3] underline underline-offset-2 hover:text-white';

export function PaymentTermsBody() {
  return (
    <>
      <LegalSectionCard id="section-1" title="1. Introduction">
        <LegalParagraph>
          Quilora is an AI-powered reading and knowledge-mapping platform that helps you build, connect, and validate deep understanding across your reading list, from fiction and narratives to any form of text. This Payments and Subscriptions Agreement (&quot;Payments Agreement&quot;) governs all financial transactions between you and Quilora, including subscription purchases, Genesis Account purchases, Boost Pack purchases, and credit allocation.
        </LegalParagraph>
        <LegalParagraph>
          Our order process is conducted by our online reseller Dodo Payments. Dodo Payments is the Merchant of Record for all our orders. Dodo Payments provides all customer payment service inquiries and handles payment-related returns.
        </LegalParagraph>
        <LegalParagraph>
          This Payments Agreement is incorporated into and forms part of the Quilora <Link to="/terms">Terms of Service</Link>. In the event of a conflict between this Payments Agreement and the Terms of Service, the Terms of Service prevail. By completing a purchase through Quilora, you agree to the terms of this Payments Agreement.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-2" title="2. Merchant of Record — Dodo Payments">
        <LegalParagraph>All payments processed through Quilora are handled by Dodo Payments, which acts as the reseller and Merchant of Record for all Quilora purchases. This means:</LegalParagraph>
        <LegalBulletList>
          <li>Your payment is processed by Dodo Payments, not directly by Quilora;</li>
          <li>Dodo Payments is responsible for collecting and remitting applicable sales tax, VAT, and other transaction taxes;</li>
          <li>Your billing statement will show a charge from Dodo Payments, not from Quilora;</li>
          <li>
            Payment card data, billing addresses, and payment credentials are collected and stored exclusively by Dodo Payments — Quilora does not store your payment details;
          </li>
          <li>
            Dodo Payments Terms of Service and Privacy Policy (available at{' '}
            <a href="https://www.dodopayments.com" className={linkClass}>
              dodopayments.com
            </a>
            ) apply to the payment transaction itself.
          </li>
        </LegalBulletList>
        <LegalParagraph>By purchasing through Quilora, you consent to your transaction data being shared with Dodo Payments solely for billing and compliance purposes.</LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-3" title="3. Subscription Tiers and Pricing">
        <LegalParagraph>
          Quilora offers the following subscription plans. All prices are exclusive of applicable taxes, which are collected and remitted by Dodo Payments as Merchant of Record.
        </LegalParagraph>
        <LegalBulletList>
          <li>
            <strong>Bookworm — $6.00/mo:</strong> 800 AI credits per month, up to 5 workspaces, no rollover.
          </li>
          <li>
            <strong>Sage — $16.00/mo:</strong> 2,500 AI credits per month, unlimited workspaces, rollover enabled.
          </li>
          <li>
            <strong>Genesis Account — $80 or $119 (one-time):</strong> 15,000 legacy credits, unlimited workspaces, N/A rollover (one-time purchase).
          </li>
        </LegalBulletList>
        <LegalParagraph>
          <strong>3.1 Introductory Pricing</strong> — New Bookworm and Sage subscribers receive a 20% discount on their first billing month: Bookworm first month is $4.80; Sage first month is $12.80. This introductory discount applies to the first billing cycle only.
        </LegalParagraph>
        <LegalParagraph>
          <strong>3.2 Genesis Account</strong> — The Genesis Account is a limited, one-time purchase available to the first 200 purchasers only. Slots are enforced server-side in real time. Genesis Account perks include: Bookworm-tier access at no recurring subscription cost; 15,000 legacy AI credits (non-expiring); 20% lifetime discount on future Sage or higher tier subscriptions; permanent Genesis identity badge on profile and within the platform. Genesis Account purchases are final — see Section 6 (Refunds).
        </LegalParagraph>
        <LegalParagraph>
          <strong>3.3 Boost Pack</strong> — Boost Packs provide 200 additional AI credits for $1.99 USD, available to all subscription tiers at any time. Credits are applied to your account within 30 seconds of purchase confirmation.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-4" title="4. Billing and Auto-Renewal">
        <LegalBulletList>
          <li>Bookworm and Sage subscriptions are billed on a monthly recurring basis. Your payment method on file with Dodo Payments will be automatically charged at the start of each billing cycle.</li>
          <li>
            <strong>Billing date:</strong> The same calendar date each month as your initial purchase date.
          </li>
          <li>
            <strong>Failed payments:</strong> If a payment fails, we will retry in accordance with Dodo Payments dunning process. Access to the Services may be restricted if payment cannot be collected after retry attempts.
          </li>
          <li>
            <strong>Credit allocation:</strong> Monthly AI credits are allocated at the start of each billing cycle upon successful payment. Credits are not pro-rated for mid-cycle changes.
          </li>
          <li>
            <strong>Upgrade:</strong> Upgrading from Bookworm to Sage takes effect immediately upon payment. New credit allocation and tier benefits apply from the upgrade date.
          </li>
          <li>
            <strong>Downgrade:</strong> Downgrading from Sage to Bookworm takes effect at the end of the current billing period. Workspaces exceeding the Bookworm limit of 5 will be placed in read-only state.
          </li>
        </LegalBulletList>
      </LegalSectionCard>

      <LegalSectionCard id="section-5" title="5. Cancellation">
        <LegalParagraph>
          You may cancel your subscription at any time through your account settings or by contacting{' '}
          <a href={mail} className={linkClass}>
            {QUILORA_CONTACT_EMAIL}
          </a>
          . Cancellation takes effect at the end of your current billing period — you retain access and your current credit balance until that date.
        </LegalParagraph>
        <LegalParagraph>
          After cancellation: your canvas data, workspaces, and uploaded content are retained for 90 days, during which you may resubscribe to restore full access. After 90 days of inactivity following cancellation, your data may be deleted in accordance with our <Link to="/privacy">Privacy Policy</Link>. Unused credits are forfeited upon account closure and are not refundable.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-6" title="6. Refund Policy">
        <LegalParagraph>Quilora&apos;s refund policy complies with Dodo Payments reseller terms and applicable consumer protection law.</LegalParagraph>
        <LegalParagraph>
          <strong>6.1 Subscription Refunds</strong> — Refund requests for Bookworm or Sage subscription charges must be submitted within 48 hours of the billing date and must not involve active use of the Services during that billing cycle. Submit requests to{' '}
          <a href={mail} className={linkClass}>
            {QUILORA_CONTACT_EMAIL}
          </a>{' '}
          with your Dodo Payments order number and a description of the issue. Approved refunds are processed by Dodo Payments and may take 5–10 business days to appear on your statement.
        </LegalParagraph>
        <LegalParagraph>
          <strong>6.2 Boost Pack Refunds</strong> — Boost Pack purchases are non-refundable once AI credits have been applied to your account balance.
        </LegalParagraph>
        <LegalParagraph>
          <strong>6.3 Genesis Account Refunds</strong> — Genesis Account purchases are non-refundable, given the limited-slot, lifetime perk nature of the offering. This is clearly disclosed at the time of purchase.
        </LegalParagraph>
        <LegalParagraph>
          <strong>6.4 Failed AI Call Credit Rollback</strong> — Quilora uses a deduct-then-confirm credit system. If an AI action fails due to a timeout, API error, or partial response, credits are automatically rolled back to your account. No refund request is required — the rollback is immediate and automatic.
        </LegalParagraph>
        <LegalParagraph>
          <strong>6.5 Consumer Protection Rights</strong> — Nothing in this refund policy limits your statutory rights under applicable consumer protection law. EU/EEA consumers may have additional rights under EU consumer law, including rights under Directive 2011/83/EU on consumer rights.
        </LegalParagraph>
        <LegalParagraph>
          A dedicated summary is also published at <Link to="/refund-policy">Refund Policy</Link>.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-7" title="7. Taxes">
        <LegalParagraph>
          As Merchant of Record, Dodo Payments is responsible for determining, collecting, and remitting applicable sales tax, VAT, GST, and other transaction taxes based on your billing address and applicable tax laws. Prices displayed at checkout are exclusive of tax. Any applicable tax will be added at checkout.
        </LegalParagraph>
        <LegalParagraph>For business customers in VAT-registered jurisdictions, Dodo Payments provides VAT-compliant invoices upon request.</LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-8" title="8. Credit System Terms">
        <LegalParagraph>
          <strong>8.1 Nature of Credits</strong> — AI credits are a non-monetary in-app unit used exclusively to access AI-powered features within Quilora. Credits have no cash value, are non-transferable, and cannot be exchanged for money or other products. Credits are allocated to individual accounts and may not be shared.
        </LegalParagraph>
        <LegalParagraph>
          <strong>8.2 What Quilora Is — and Is Not</strong> — Quilora is a software platform — not a content publisher or content distributor. The Services provide AI-powered analytical tools that users apply to content they upload themselves or activate from a publicly licensed Creative Commons library. Quilora does not supply, distribute, or resell third-party texts to users. All content processing is performed on content provided by and belonging to each individual user.
        </LegalParagraph>
        <LegalParagraph>
          <strong>8.3 Credit Costs</strong> — The following AI actions consume credits:
        </LegalParagraph>
        <LegalBulletList>
          <li>Lens Activation (per lens): 3–8 credits</li>
          <li>Evidence Anchor: 2 credits</li>
          <li>Micro-Detail Search: 2 credits</li>
          <li>Knowledge Map Evaluation (Core Mastery): 10–25 credits</li>
          <li>Freestyle Node Prompt: 1 credit</li>
          <li>Connector AI Analysis: 2 credits</li>
          <li>Guided Discussion Exchange (Tutor Mode): 1 credit</li>
          <li>Entity Extractor: 3 credits</li>
          <li>AI Lens (Reading Mode Summarizer): 1 credit per selection</li>
          <li>Study Chat / Direct Prompt: 1 credit per prompt</li>
          <li>OCR Parsing (Bookworm only): 5 credits per document</li>
          <li>CC Library Activation: 5 credits per title</li>
        </LegalBulletList>
        <LegalParagraph>
          Non-AI actions (canvas pan/zoom, file uploads, annotations, dictionary lookups, block movement, CC Library browsing) do not cost credits and are either free or governed by tier limits.
        </LegalParagraph>
        <LegalParagraph>
          <strong>8.4 Credit Deduction Architecture</strong> — Credits are deducted using a deduct-then-confirm pattern: credits move to &quot;pending&quot; when an AI action fires, are confirmed upon successful response receipt, and are automatically rolled back on failure (timeout, API error, or partial response). Low-quality but complete AI outputs are not automatically refunded; users may report them via the in-app &quot;Report this response&quot; mechanism.
        </LegalParagraph>
        <LegalParagraph>
          <strong>8.5 Credit Expiry</strong> — Bookworm credits reset at the start of each billing cycle. Unused credits do not carry over. Sage credits accumulate with no expiry. Unused credits roll over indefinitely. Boost Pack credits do not expire and persist until used, regardless of subscription tier. Credits are forfeited upon account termination or closure for cause.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-9" title="9. Billing Disputes">
        <LegalParagraph>
          If you believe you have been incorrectly charged, please contact us first at{' '}
          <a href={mail} className={linkClass}>
            {QUILORA_CONTACT_EMAIL}
          </a>{' '}
          before initiating a chargeback with your bank or card issuer. We will investigate and resolve valid billing disputes promptly.
        </LegalParagraph>
        <LegalParagraph>
          Initiating a chargeback without first contacting Quilora may result in account suspension. We reserve the right to contest chargebacks where the charge was valid and the Services were used.
        </LegalParagraph>
        <LegalParagraph>
          For disputes related to the payment transaction itself, you may also contact Dodo Payments support directly (Merchant of Record):{' '}
          <a href="https://www.dodopayments.com/help" className={linkClass}>
            https://www.dodopayments.com/help
          </a>
          .
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-10" title="10. Changes to Pricing and Terms">
        <LegalParagraph>
          Quilora reserves the right to change subscription pricing, credit costs, and Boost Pack pricing with at least 14 days&apos; advance notice to active subscribers, delivered via email or in-app notification. Continued use after a price change takes effect constitutes acceptance.
        </LegalParagraph>
        <LegalParagraph>
          Genesis Account perks are permanent and not subject to modification or termination by Quilora. The 20% lifetime discount on Sage+ for Genesis users is guaranteed for the lifetime of the Genesis Account holder&apos;s subscription.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-11" title="11. Payment Channel Compliance">
        <LegalParagraph>Quilora is designed and operated in compliance with the acceptable use policies of its payment processing partners. Accordingly:</LegalParagraph>
        <LegalBulletList>
          <li>
            Quilora sells a bona fide software service — an AI-powered reading and knowledge-mapping platform — delivered electronically. No physical goods, human services, or third-party content are sold.
          </li>
          <li>
            Quilora does not resell, sublicense, or distribute third-party copyrighted content. The CC Library consists solely of public domain and Creative Commons-licensed texts under licenses that permit commercial use.
          </li>
          <li>Subscription charges, renewal terms, and cancellation rights are clearly disclosed prior to purchase.</li>
          <li>Refund mechanisms are provided in accordance with Merchant of Record requirements and applicable consumer protection law.</li>
          <li>Quilora does not engage in deceptive billing, hidden fees, or unauthorized charges.</li>
          <li>Quilora does not use outbound telemarketing, automated social media marketing, or mass messaging as sales channels.</li>
          <li>Quilora does not operate as a marketplace enabling third-party sellers to sell products or services to end customers.</li>
        </LegalBulletList>
      </LegalSectionCard>

      <LegalSectionCard id="section-12" title="12. Contact">
        <LegalParagraph>For billing inquiries, refund requests, or questions about this Payments Agreement:</LegalParagraph>
        <LegalParagraph>
          <strong>Email:</strong>{' '}
          <a href={mail} className={linkClass}>
            {QUILORA_CONTACT_EMAIL}
          </a>
        </LegalParagraph>
        <LegalParagraph>
          <strong>Address:</strong> Nerkeza Smailagića 11, Sarajevo, Bosnia and Herzegovina
        </LegalParagraph>
        <LegalParagraph>
          For payment transaction disputes: contact Dodo Payments support via{' '}
          <a href="https://www.dodopayments.com/help" className={linkClass}>
            https://www.dodopayments.com/help
          </a>
          .
        </LegalParagraph>
      </LegalSectionCard>
    </>
  );
}
