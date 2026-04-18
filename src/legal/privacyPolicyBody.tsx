import { Link } from 'react-router';
import { LegalBulletList, LegalParagraph, LegalSectionCard } from '../components/legal/LegalDocumentPage';
import { QUILORA_CONTACT_EMAIL } from '../lib/siteContact';

const mail = `mailto:${QUILORA_CONTACT_EMAIL}`;

export function PrivacyPolicyBody() {
  return (
    <>
      <LegalSectionCard id="section-1" title="1. Introduction">
        <LegalParagraph>
          Quilora is an AI-powered reading and knowledge-mapping platform that helps you build, connect, and validate deep understanding across your reading list, from fiction and narratives to any form of text. This Privacy Policy explains how Quilora (&quot;we,&quot; &quot;us,&quot; &quot;our&quot;), operated from Nerkeza Smailagića 11, Sarajevo, Bosnia and Herzegovina, collects, uses, processes, stores, and shares your personal data when you use our Services at{' '}
          <a href="https://quilora.app">https://quilora.app</a>.
        </LegalParagraph>
        <LegalParagraph>
          We are committed to protecting your privacy and handling your data transparently. This Policy should be read together with our <Link to="/terms">Terms of Service</Link> and <Link to="/payments">Payments Agreement</Link>.
        </LegalParagraph>
        <LegalParagraph>
          If you are located in the European Economic Area (EEA), United Kingdom, or Switzerland, your personal data is processed in accordance with the General Data Protection Regulation (GDPR) and applicable local data protection law, which grants you additional rights described in Section 8 below.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-2" title="2. Data We Collect">
        <LegalParagraph>
          <strong>2.1 Account and Identity Data</strong> — Email address (required for registration and account management); display name (optional, user-defined); account tier and subscription status; Genesis Account status and badge (where applicable).
        </LegalParagraph>
        <LegalParagraph>
          <strong>2.2 Payment and Billing Data</strong> — Payment transactions are processed exclusively by Polar, our Merchant of Record. Quilora does not store, access, or process your full payment card details. We receive from Polar only: order confirmation, subscription status, tier assignment, and transaction ID for credit allocation purposes.
        </LegalParagraph>
        <LegalParagraph>
          <strong>2.3 User-Uploaded Content</strong> — When you upload documents (PDF, EPUB), paste text, or activate CC Library titles, Quilora processes and stores: the full text of uploaded documents, chunked into passages of approximately 500–800 tokens each for AI processing; vector embeddings of each chunk, stored in our pgvector database (Supabase), used to retrieve relevant passages when AI features are activated; document metadata: filename, upload date, file type, and chapter structure. Your uploaded content is processed solely to provide the Services to you. We do not use your content to train AI models, and we do not make your content available to other users.
        </LegalParagraph>
        <LegalParagraph>
          <strong>2.4 Canvas and Usage Data</strong> — Workspace names, block content, block positions, connector relationships, and tags; favorite block designations and cross-workspace references; feature usage events: lens activations, evidence anchors, connector creations, canvas analysis sessions; credit deduction logs: action type, AI model used, credit cost, timestamp, source block ID, deduction status (pending/confirmed/refunded).
        </LegalParagraph>
        <LegalParagraph>
          <strong>2.5 Technical and Device Data</strong> — IP address and general geographic location (country/region); browser type, version, and operating system; session tokens and authentication state (managed via Supabase Auth); error logs and crash reports.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-3" title="3. Legal Basis for Processing (GDPR)">
        <LegalParagraph>For users in the EEA, UK, or Switzerland, we process your personal data on the following legal bases:</LegalParagraph>
        <LegalBulletList>
          <li>
            <strong>Contract performance (Article 6(1)(b) GDPR):</strong> Processing necessary to provide the Services you have purchased, including account creation, credit allocation, AI feature delivery, and canvas persistence.
          </li>
          <li>
            <strong>Legitimate interests (Article 6(1)(f) GDPR):</strong> Processing for security, fraud prevention, service improvement, and internal analytics, where these interests are not overridden by your rights.
          </li>
          <li>
            <strong>Legal obligation (Article 6(1)(c) GDPR):</strong> Processing required to comply with applicable law, including retention of billing records and response to valid legal orders.
          </li>
          <li>
            <strong>Consent (Article 6(1)(a) GDPR):</strong> Where you have provided explicit consent for specific optional processing, such as marketing communications. You may withdraw consent at any time.
          </li>
        </LegalBulletList>
      </LegalSectionCard>

      <LegalSectionCard id="section-4" title="4. How We Use Your Data">
        <LegalParagraph>We use the data we collect for the following purposes:</LegalParagraph>
        <LegalBulletList>
          <li>Account and authentication management via Supabase Auth;</li>
          <li>Processing payments and allocating subscription credits via Polar webhooks;</li>
          <li>
            Chunking, embedding, and retrieving your uploaded content via pgvector (Supabase) to power AI features including analytical lenses, evidence anchors, reading feedback, and inline chat prompts;
          </li>
          <li>Persisting your canvas state (blocks, connectors, positions) for non-linear re-entry across sessions;</li>
          <li>Logging credit deductions with full audit metadata for accuracy and dispute resolution;</li>
          <li>Enforcing tier-based access controls (workspace limits, Favorite Block caps, OCR credit costs);</li>
          <li>Communicating with you about your account, subscription changes, and service updates;</li>
          <li>Detecting and preventing fraud, abuse, and Terms of Service violations;</li>
          <li>Improving the Services through aggregated, anonymized usage analytics.</li>
        </LegalBulletList>
      </LegalSectionCard>

      <LegalSectionCard id="section-5" title="5. AI Processing and the Trust Factor">
        <LegalParagraph>Quilora uses a Retrieval-Augmented Generation (RAG) architecture for all AI-powered features. When you trigger an AI action, the system:</LegalParagraph>
        <LegalBulletList>
          <li>Queries your stored vector embeddings to retrieve the most relevant passages from your source material (typically 5–15 chunks, depending on the action);</li>
          <li>Injects only those retrieved chunks — not your full document — into the AI model&apos;s prompt context;</li>
          <li>
            Sends the prompt to a third-party AI model provider (either a high-capability model for complex tasks like lens analysis and evidence anchors, or a lightweight model for inline chat and guided discussion exchanges);
          </li>
          <li>Returns the response to you and confirms or rolls back your credit deduction.</li>
        </LegalBulletList>
        <LegalParagraph>
          Quilora&apos;s Trust Factor system attaches source block metadata (source ID, chapter, section) to all AI outputs. This enables citation tracking and helps prevent AI hallucination, but does not guarantee factual accuracy.
        </LegalParagraph>
        <LegalParagraph>
          We use third-party AI model providers to process prompts. These providers may process your query content and relevant retrieved text passages as part of generating responses. We select providers with appropriate data processing agreements and do not permit our AI providers to use your content for model training.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-6" title="6. Data Sharing and Third Parties">
        <LegalParagraph>
          <strong>6.1 Polar (Payment Processor and Merchant of Record)</strong> — Polar processes all payment transactions. Your billing data is collected and stored by Polar under their own Privacy Policy (available at{' '}
          <a href="https://polar.sh/legal/privacy">polar.sh/legal/privacy</a>). Polar provides Quilora with subscription status, tier assignments, and order confirmations only.
        </LegalParagraph>
        <LegalParagraph>
          <strong>6.2 Supabase (Database and Authentication Infrastructure)</strong> — Supabase serves as our primary infrastructure provider for: database storage (user accounts, canvas data, block content), authentication and session management (Supabase Auth), and vector embedding storage (pgvector). Supabase processes data under a Data Processing Agreement consistent with GDPR requirements.
        </LegalParagraph>
        <LegalParagraph>
          <strong>6.3 AI Model Providers</strong> — AI-generated responses are produced by third-party large language model providers. These providers receive only: the retrieved text chunks relevant to your query, your prompt, and necessary metadata. They do not receive your full documents or account identity information. We maintain data processing agreements with all AI providers.
        </LegalParagraph>
        <LegalParagraph>
          <strong>6.4 Legal Requirements</strong> — We may disclose your data when required by law, court order, or governmental authority, or when necessary to protect the rights, property, or safety of Quilora, its users, or the public.
        </LegalParagraph>
        <LegalParagraph>
          <strong>6.5 No Sale of Data</strong> — Quilora does not sell, rent, or trade your personal data to third parties for their own marketing or commercial purposes.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-7" title="7. Data Retention">
        <LegalParagraph>We retain your personal data for as long as your account is active or as necessary to provide the Services:</LegalParagraph>
        <LegalBulletList>
          <li>
            <strong>Account data</strong> (email, tier, display name): Retained for the duration of your account and deleted within 30 days of account closure request.
          </li>
          <li>
            <strong>Canvas data</strong> (blocks, connectors, workspaces) and uploaded content: Retained while your account is active. After cancellation, retained for 90 days to allow resubscription, then deleted. Soft-deleted source blocks are recoverable for 30 days, then permanently removed.
          </li>
          <li>
            <strong>Vector embeddings and chunked content:</strong> Retained while the associated source block exists. Deleted with the source block after the 30-day recovery window.
          </li>
          <li>
            <strong>Credit deduction logs:</strong> Retained for 24 months for billing accuracy and dispute resolution.
          </li>
          <li>
            <strong>Payment and billing records:</strong> Retained for a minimum of 5 years as required by applicable financial and tax law.
          </li>
          <li>
            <strong>Anonymized usage analytics:</strong> Retained indefinitely in aggregate, anonymized form.
          </li>
        </LegalBulletList>
      </LegalSectionCard>

      <LegalSectionCard id="section-8" title="8. Your Rights">
        <LegalParagraph>Depending on your location, you may have the following rights regarding your personal data:</LegalParagraph>
        <LegalBulletList>
          <li>
            <strong>Right of Access:</strong> Request a copy of the personal data we hold about you.
          </li>
          <li>
            <strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete data.
          </li>
          <li>
            <strong>Right to Erasure:</strong> Request deletion of your personal data, subject to legal retention obligations.
          </li>
          <li>
            <strong>Right to Restriction:</strong> Request that we restrict processing of your data under certain circumstances.
          </li>
          <li>
            <strong>Right to Data Portability:</strong> Request your data in a structured, machine-readable format.
          </li>
          <li>
            <strong>Right to Object:</strong> Object to processing based on legitimate interests.
          </li>
          <li>
            <strong>Right to Withdraw Consent:</strong> Where processing is based on consent, withdraw it at any time without affecting prior processing.
          </li>
          <li>
            <strong>Right to Lodge a Complaint:</strong> EEA users may contact their national data protection authority. Bosnia and Herzegovina users may contact the Personal Data Protection Agency (Agencija za zaštitu ličnih/osobnih podataka u BiH).
          </li>
        </LegalBulletList>
        <LegalParagraph>
          To exercise any of these rights, contact us at{' '}
          <a href={mail}>
            <strong>{QUILORA_CONTACT_EMAIL}</strong>
          </a>
          . We will respond within 30 days. We may need to verify your identity before processing your request.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-9" title="9. International Data Transfers">
        <LegalParagraph>
          Quilora is operated from Bosnia and Herzegovina. Your data may be stored and processed in countries outside your jurisdiction, including where our infrastructure providers (Supabase, AI model providers) operate data centers. Bosnia and Herzegovina does not currently hold an EU adequacy decision.
        </LegalParagraph>
        <LegalParagraph>
          For transfers of EEA/UK personal data, we rely on Standard Contractual Clauses (SCCs) as the lawful transfer mechanism, implemented through our data processing agreements with Supabase and AI model providers. By using the Services, you acknowledge that your data may be transferred and processed outside your country of residence.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-10" title="10. Security">
        <LegalParagraph>We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, disclosure, alteration, or destruction. These measures include:</LegalParagraph>
        <LegalBulletList>
          <li>Authentication and session management via Supabase Auth with email verification requirements;</li>
          <li>Encrypted data storage and transmission (HTTPS/TLS);</li>
          <li>Access controls limiting internal access to user data on a need-to-know basis;</li>
          <li>Credit audit logging for all AI transactions.</li>
        </LegalBulletList>
        <LegalParagraph>
          No method of electronic transmission or storage is 100% secure. In the event of a data breach likely to result in risk to your rights and freedoms, we will notify affected users and relevant authorities as required by applicable law.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-11" title="11. Children&apos;s Privacy">
        <LegalParagraph>
          The Services are not directed to children under 13 years of age. We do not knowingly collect personal data from children under 13. If you believe a child under 13 has provided us with personal data, please contact us at{' '}
          <a href={mail}>{QUILORA_CONTACT_EMAIL}</a> and we will delete the information promptly.
        </LegalParagraph>
        <LegalParagraph>
          Users between 13 and 17 must have verifiable parental or guardian consent to use the Services, as required by our <Link to="/terms">Terms of Service</Link>.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-12" title="12. Cookies and Tracking">
        <LegalParagraph>
          Quilora uses essential cookies and local storage to maintain session state and authentication tokens. We do not use third-party advertising cookies or behavioral tracking technologies for advertising purposes.
        </LegalParagraph>
        <LegalParagraph>
          Essential session cookies are necessary for the Services to function and cannot be disabled without preventing use of the Services.
        </LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-13" title="13. Changes to This Policy">
        <LegalParagraph>
          We may update this Privacy Policy from time to time. Material changes will be communicated via email and/or in-app notice at least 14 days before taking effect. The updated policy will be published at{' '}
          <a href="https://quilora.app">https://quilora.app</a> with the revised Last Updated date.
        </LegalParagraph>
        <LegalParagraph>Your continued use of the Services after the effective date constitutes acceptance of the updated Privacy Policy.</LegalParagraph>
      </LegalSectionCard>

      <LegalSectionCard id="section-14" title="14. Contact and Data Controller">
        <LegalParagraph>Quilora is the data controller for personal data processed under this Privacy Policy.</LegalParagraph>
        <LegalParagraph>For privacy inquiries, data subject rights requests, or complaints:</LegalParagraph>
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
        <LegalParagraph>We aim to respond to all privacy inquiries within 30 days.</LegalParagraph>
      </LegalSectionCard>
    </>
  );
}
