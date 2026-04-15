import { LegalBulletList, LegalParagraph, LegalSectionCard } from '../components/legal/LegalDocumentPage';

export function PaymentTermsBody() {
  return (
    <>
      <LegalSectionCard id="section-1" title="1. INTRODUCTION">
        <LegalParagraph>
          This Payments and Subscriptions Agreement (&quot;Agreement&quot;) governs the billing, payment, and subscription terms for your use of the Quilora platform. This Agreement supplements our Terms of Service. By purchasing a paid subscription or feature on Quilora, you agree to these payment terms.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-2" title="2. PADDLE AS OUR MERCHANT OF RECORD">
        <LegalParagraph>
          To ensure a secure and globally compliant checkout experience, Quilora partners with Paddle.com (&quot;Paddle&quot;).
        </LegalParagraph>
        <LegalParagraph>
          <strong>The Seller:</strong> Paddle acts as the Merchant of Record for all Quilora transactions. This means that when you purchase a subscription, your legal contract for the purchase and payment is with Paddle, not directly with [LEGAL ENTITY NAME].
        </LegalParagraph>
        <LegalParagraph>
          <strong>Billing Statement:</strong> Charges on your credit card or bank statement will appear as &quot;PADDLE.NET * QUILORA&quot; or a similar variation.
        </LegalParagraph>
        <LegalParagraph>
          <strong>Paddle Buyer Terms:</strong> By completing a purchase, you also agree to Paddle&apos;s Checkout Buyer Terms and Conditions. Paddle is responsible for processing your payment, collecting applicable taxes, and managing the financial transaction. Quilora remains responsible for providing the software and customer support.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-3" title="3. SUBSCRIPTIONS AND AUTO-RENEWAL">
        <LegalParagraph>
          Quilora offers premium features accessible via recurring subscriptions (e.g., monthly or annual plans).
        </LegalParagraph>
        <LegalBulletList>
          <li>
            <strong>Billing Cycle:</strong> Your subscription will automatically renew at the end of each billing cycle (either monthly or annually) unless canceled beforehand.
          </li>
          <li>
            <strong>Payment Methods:</strong> You must provide Paddle with a valid, accepted payment method (such as a credit card or PayPal). By providing this, you authorize Paddle to charge the recurring subscription fees automatically.
          </li>
          <li>
            <strong>Failed Payments:</strong> If a payment fails or your card expires, Paddle will attempt to process the payment again. If the payment cannot be successfully processed, Quilora reserves the right to suspend your access to premium features until the account is brought current.
          </li>
        </LegalBulletList>
      </LegalSectionCard>

      <LegalSectionCard id="section-4" title="4. CANCELLATION POLICY">
        <LegalParagraph>You may cancel your recurring subscription at any time.</LegalParagraph>
        <LegalBulletList>
          <li>
            <strong>How to Cancel:</strong> You can cancel your subscription directly within your Quilora Account Settings or by following the secure link provided in your original Paddle emailed receipt.
          </li>
          <li>
            <strong>Access After Cancellation:</strong> If you cancel, you will not receive a prorated refund for the remainder of your current billing cycle. Instead, you will retain access to Quilora&apos;s premium features until your current paid billing period expires.
          </li>
        </LegalBulletList>
      </LegalSectionCard>

      <LegalSectionCard id="section-5" title="5. REFUND POLICY">
        <LegalParagraph>
          Because Quilora provides immediate access to digital content and AI-generated study tools, our standard policy is that all payments are non-refundable, subject to the following exceptions:
        </LegalParagraph>
        <LegalBulletList>
          <li>
            <strong>EU/UK Right of Withdrawal:</strong> If you are a consumer based in the European Union or the United Kingdom, you typically have a 14-day &quot;cooling-off&quot; period. However, by accessing Quilora&apos;s digital content immediately upon purchase, you acknowledge and agree that you lose your right of withdrawal once the digital service has been provided.
          </li>
          <li>
            <strong>Accidental Renewals:</strong> If your subscription renewed and you meant to cancel it, please contact us at{' '}
            <a href="mailto:support@quilora.com" className="font-semibold text-[#7bbdf3] underline underline-offset-2 hover:text-white">
              support@quilora.com
            </a>{' '}
            within [48 HOURS / 7 DAYS] of the charge. We review refund requests for accidental renewals on a case-by-case basis.
          </li>
          <li>
            <strong>Service Interruptions:</strong> If technical problems prevent you from accessing the Services, your exclusive remedy is either replacement of the service (account credit) or a refund, at our discretion.
          </li>
        </LegalBulletList>
      </LegalSectionCard>

      <LegalSectionCard id="section-6" title="6. TAXES">
        <LegalParagraph>
          Because Paddle acts as the Merchant of Record, Paddle is responsible for calculating, collecting, and remitting all applicable sales taxes, Value-Added Tax (VAT), or Goods and Services Tax (GST) based on your location.
        </LegalParagraph>
        <LegalBulletList>
          <li>Any applicable taxes will be calculated and clearly displayed to you at checkout before you confirm your purchase.</li>
          <li>
            If you are purchasing on behalf of a business and are tax-exempt or have a valid VAT ID, you may enter this information during the Paddle checkout process to remove the tax charge.
          </li>
        </LegalBulletList>
      </LegalSectionCard>

      <LegalSectionCard id="section-7" title="7. DISPUTES AND CHARGEBACKS">
        <LegalParagraph>
          Before initiating a chargeback, you must contact Quilora at{' '}
          <a href="mailto:support@quilora.com" className="font-semibold text-[#7bbdf3] underline underline-offset-2 hover:text-white">
            support@quilora.com
          </a>
          . Fraudulent disputes may result in permanent account suspension.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-8" title="8. PRICE CHANGES">
        <LegalParagraph>We may change subscription prices. Users will be notified at least 30 days in advance.</LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-contact" title="Billing support">
        <LegalParagraph>
          <a href="mailto:support@quilora.com" className="font-semibold text-[#7bbdf3] underline underline-offset-2 hover:text-white">
            support@quilora.com
          </a>
        </LegalParagraph>
        <LegalParagraph>
          <a href="https://paddle.com/contact" className="font-semibold text-[#7bbdf3] underline underline-offset-2 hover:text-white">
            https://paddle.com/contact
          </a>
        </LegalParagraph>
      </LegalSectionCard>
    </>
  );
}
