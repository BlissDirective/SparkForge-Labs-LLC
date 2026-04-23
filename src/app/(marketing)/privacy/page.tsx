import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — SparkForge',
  description:
    'SparkForge privacy policy. Learn how we protect children\'s data and comply with COPPA.',
};

// ════════════════════════════════════════════════════
// PRIVACY POLICY — COPPA-Compliant (FTC 16 CFR Part 312)
// Covers: 2025 COPPA Amendments (effective April 22, 2026)
// Sections: Operator ID, Data Collection, Data Use, Third-Party
//           Disclosure, Parental Rights, VPC Method, Data Retention,
//           Security Program, Cookies, Children's Rights, Contact
// LEGAL REVIEW REQUIRED before production launch.
// ════════════════════════════════════════════════════

export default function PrivacyPage() {
  return (
    <div className="pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-6">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-block px-3 py-1 rounded-full bg-spark-blue/10 border border-spark-blue/20 text-spark-blue text-xs font-data uppercase tracking-wider mb-4">
            COPPA Compliant
          </div>
          <h1 className="font-display text-4xl font-bold mb-3 bg-gradient-to-r from-spark-blue to-spark-purple bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="text-white/70 font-body">
            Effective Date: March 30, 2026 &middot; Last Updated: March 30, 2026
          </p>
        </div>

        <div className="space-y-10 font-body text-white/70 leading-relaxed">
          {/* ═══ Section 1: Operator Identification ═══ */}
          <section id="operator">
            <h2 className="font-display text-xl font-semibold text-white mb-3">
              1. Who We Are (Operator Identification)
            </h2>
            <p>
              SparkForge is operated by <strong className="text-white/90">SparkForge LLC</strong> (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;).
              SparkForge is a gamified AI learning platform designed for children ages 7&ndash;16.
            </p>
            <div className="mt-4 p-4 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <p className="text-sm text-white/50">
                <strong className="text-white/70">SparkForge LLC</strong> <span className="text-white/40">(an Illinois limited liability company)</span><br />
                Mailing address: <span className="text-white/70">[MAILING ADDRESS — to be finalized before production launch]</span><br />
                Telephone: <a href="tel:+17736292320" className="text-spark-blue hover:underline">(773) 629-2320</a><br />
                Privacy email: <a href="mailto:privacy@sparkforge-labs.com" className="text-spark-blue hover:underline">privacy@sparkforge-labs.com</a><br />
                For privacy inquiries, parental rights requests, or COPPA-related questions, contact us using any method above.
              </p>
              <p className="mt-3 text-xs text-white/40">
                Disclosure pursuant to 16 CFR &sect; 312.4(d)(1) (COPPA operator identification).
              </p>
            </div>
            <p className="mt-4">
              This Privacy Policy describes our practices regarding the collection, use, and disclosure of personal information
              from children and parents/guardians who use SparkForge. We comply with the Children&apos;s Online Privacy Protection
              Act (COPPA) and the 2025 COPPA Rule Amendments (16 CFR Part 312).
            </p>
          </section>

          {/* ═══ Section 2: Information We Collect ═══ */}
          <section id="data-collection">
            <h2 className="font-display text-xl font-semibold text-white mb-3">
              2. Information We Collect
            </h2>
            <p className="mb-4">
              We collect only the minimum information necessary to provide the SparkForge learning experience.
              Children are <strong className="text-white/90">never required to disclose more information than is
              reasonably necessary</strong> to participate in any activity.
            </p>

            <h3 className="font-display text-lg font-medium text-white/90 mb-2">
              2a. Parent/Guardian Account Information (Actively Provided)
            </h3>
            <ul className="list-disc list-inside space-y-1.5 text-white/60 mb-4">
              <li>Email address (for account creation and communication)</li>
              <li>Password (stored as a cryptographic hash &mdash; we never store plaintext passwords)</li>
              <li>COPPA consent timestamp (date and time parental consent was given)</li>
              <li>Subscription tier and billing status (Free, Plus, or Forge)</li>
              <li>Stripe customer ID (for paid subscriptions only &mdash; payment details are held by Stripe, not by us)</li>
            </ul>

            <h3 className="font-display text-lg font-medium text-white/90 mb-2">
              2b. Child Profile Information (Created by Parent)
            </h3>
            <ul className="list-disc list-inside space-y-1.5 text-white/60 mb-4">
              <li>Display name (chosen by the parent &mdash; no real name required)</li>
              <li>Age band (A: 7&ndash;9, B: 10&ndash;12, C: 13&ndash;16 &mdash; used for content difficulty, not stored as exact birthdate)</li>
              <li>Avatar configuration (visual appearance selections)</li>
              <li>Learning preferences (optional content personalization)</li>
            </ul>

            <h3 className="font-display text-lg font-medium text-white/90 mb-2">
              2c. Automatically Collected Usage Data
            </h3>
            <ul className="list-disc list-inside space-y-1.5 text-white/60 mb-4">
              <li>Game progress: scores, completion status, rounds played</li>
              <li>XP (experience points), level, badges earned, and streak data</li>
              <li>Session duration (time spent on platform per session)</li>
              <li>Prompt Lab interactions: text prompts submitted to the AI learning tool (ages 14&ndash;16 only)</li>
            </ul>

            <h3 className="font-display text-lg font-medium text-white/90 mb-2">
              2d. Information We Do NOT Collect
            </h3>
            <ul className="list-disc list-inside space-y-1.5 text-white/60">
              <li>Real names of children (display names only)</li>
              <li>Birthdates or exact ages (age bands only)</li>
              <li>Photos, videos, or voice recordings</li>
              <li>Geolocation or GPS data</li>
              <li>Biometric identifiers (fingerprints, facial templates, voiceprints)</li>
              <li>Government-issued identification numbers</li>
              <li>Contact information from children (email, phone, address)</li>
              <li>Social media accounts or friend lists</li>
            </ul>

            <h3 className="font-display text-lg font-medium text-white/90 mb-2 mt-6">
              2e. No Conditioning on Unnecessary Disclosure
            </h3>
            <p className="text-white/60">
              Consistent with 16 CFR &sect; 312.7, SparkForge does not condition a child&apos;s participation in any game,
              lab, activity, or feature on the child disclosing more personal information than is reasonably necessary for
              that activity. For example, gameplay in any of the 35 labs is available without the child providing free-text
              input; the Prompt Lab game (which does accept free-text input) is limited to age band C (ages 14&ndash;16) and
              is never a prerequisite for earning XP, leveling up, or completing any lab.
            </p>
          </section>

          {/* ═══ Section 3: How We Use Information ═══ */}
          <section id="data-use">
            <h2 className="font-display text-xl font-semibold text-white mb-3">
              3. How We Use Information
            </h2>
            <table className="w-full text-sm mt-2">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-2 pr-4 font-display text-white/70 font-medium">Data Type</th>
                  <th className="text-left py-2 font-display text-white/70 font-medium">Purpose</th>
                </tr>
              </thead>
              <tbody className="text-white/50">
                <tr className="border-b border-white/[0.04]">
                  <td className="py-2.5 pr-4">Parent email &amp; password</td>
                  <td className="py-2.5">Account authentication, password recovery, account-related communications</td>
                </tr>
                <tr className="border-b border-white/[0.04]">
                  <td className="py-2.5 pr-4">Child display name &amp; age band</td>
                  <td className="py-2.5">In-app personalization, age-appropriate content delivery</td>
                </tr>
                <tr className="border-b border-white/[0.04]">
                  <td className="py-2.5 pr-4">Game progress &amp; XP</td>
                  <td className="py-2.5">Track learning progress, award achievements, provide parent reports</td>
                </tr>
                <tr className="border-b border-white/[0.04]">
                  <td className="py-2.5 pr-4">Session duration</td>
                  <td className="py-2.5">Enforce parent-set time limits, display in parent dashboard</td>
                </tr>
                <tr className="border-b border-white/[0.04]">
                  <td className="py-2.5 pr-4">Prompt Lab text</td>
                  <td className="py-2.5">Generate educational AI responses (sent to Anthropic API, moderated, auto-purged daily)</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4">Stripe customer ID</td>
                  <td className="py-2.5">Process subscription payments (parent accounts only)</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* ═══ Section 4: Third-Party Service Disclosure ═══ */}
          <section id="third-parties">
            <h2 className="font-display text-xl font-semibold text-white mb-3">
              4. Third-Party Services
            </h2>
            <p className="mb-4">
              We share limited data with the following third-party services solely to operate SparkForge.
              <strong className="text-white/90"> No child data is shared with advertisers, data brokers, or any party
              for the purpose of targeted advertising or profiling.</strong>
            </p>

            <div className="space-y-4">
              {[
                {
                  name: 'Supabase (Database & Authentication)',
                  data: 'Account credentials, child profiles, game progress, session data',
                  purpose: 'Database hosting, user authentication, real-time data sync',
                  security: 'Data encrypted at rest and in transit. Row Level Security (RLS) enforced on all tables.',
                },
                {
                  name: 'Stripe (Payment Processing)',
                  data: 'Parent payment information only (card details, billing address)',
                  purpose: 'Subscription billing for Plus and Forge tiers',
                  security: 'PCI DSS Level 1 compliant. SparkForge never stores card numbers — Stripe handles all payment data.',
                },
                {
                  name: 'Anthropic Claude API (AI Content)',
                  data: 'Prompt text submitted in the Prompt Lab game (ages 14\u201316 only)',
                  purpose: 'Generate educational AI responses for the Prompt Lab learning game',
                  security: 'Prompts are screened through multi-layer moderation (pattern matching + LLM safety filter) before and after submission. Prompt history is automatically purged daily.',
                },
                {
                  name: 'Vercel (Application Hosting)',
                  data: 'IP addresses, standard HTTP request logs',
                  purpose: 'Host and serve the SparkForge web application',
                  security: 'TLS encryption on all connections. Logs auto-expire per Vercel retention policy.',
                },
                {
                  name: 'Sentry (Error Monitoring)',
                  data: 'Application error data, stack traces, device type',
                  purpose: 'Detect and fix software bugs to maintain platform reliability',
                  security: 'Configured with beforeSend PII scrubbing to strip all child-related fields (display names, age bands, XP, badges) before data leaves the browser. Session replay masks all text and blocks all media.',
                },
              ].map((service) => (
                <div key={service.name} className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                  <h4 className="font-display text-sm font-semibold text-white/80 mb-2">{service.name}</h4>
                  <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs text-white/50">
                    <span className="text-white/60">Data shared:</span>
                    <span>{service.data}</span>
                    <span className="text-white/60">Purpose:</span>
                    <span>{service.purpose}</span>
                    <span className="text-white/60">Security:</span>
                    <span>{service.security}</span>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-4 text-sm text-white/70">
              Parents may consent to our collection and use of a child&apos;s information without consenting to
              disclosure to third parties, except where disclosure is integral to the service (e.g., Supabase
              for data storage).
            </p>
          </section>

          {/* ═══ Section 5: Parental Consent (VPC) ═══ */}
          <section id="consent">
            <h2 className="font-display text-xl font-semibold text-white mb-3">
              5. Parental Consent Process
            </h2>
            <p className="mb-4">
              SparkForge requires verifiable parental consent before collecting any personal information from children
              under 13. Our consent process:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-white/60">
              <li><strong className="text-white/80">Parent account creation:</strong> Only adults (18+) can create a SparkForge account.</li>
              <li><strong className="text-white/80">Age confirmation:</strong> The parent confirms they are at least 18 years of age.</li>
              <li><strong className="text-white/80">COPPA consent checkbox:</strong> The parent explicitly checks a consent box acknowledging they have read this Privacy Policy and consent to their child&apos;s use of SparkForge.</li>
              <li><strong className="text-white/80">Consent recorded:</strong> The exact timestamp of consent is stored in our database.</li>
              <li><strong className="text-white/80">Child profile creation:</strong> Only after consent is recorded can the parent create a child profile.</li>
            </ol>
            <p className="mt-4">
              If we do not receive verifiable parental consent, we will not collect personal information from the child
              and will delete any parent contact information collected during the consent process within a reasonable time.
            </p>

            <h3 className="font-display text-lg font-medium text-white/90 mb-2 mt-6">
              5a. VPC Method Used
            </h3>
            <p className="text-white/60 mb-3">
              SparkForge uses the <strong className="text-white/80">&quot;email-plus&quot;</strong> method of Verifiable
              Parental Consent permitted under 16 CFR &sect; 312.5(b)(2)(iii). The process is:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-white/60 mb-3">
              <li>A parent creates the account and provides their email address.</li>
              <li>The parent verifies the email by clicking a confirmation link sent to that address.</li>
              <li>The parent checks a COPPA consent checkbox affirmatively acknowledging this Privacy Policy.</li>
              <li>A server-side timestamp of the affirmative consent action is recorded and retained for at least three years.</li>
              <li>Before the child&apos;s first interaction, a confirmation email is sent to the same verified address summarizing the consent granted and explaining how to revoke it at any time.</li>
            </ol>
            <p className="text-white/60 mb-3">
              Under COPPA 16 CFR &sect; 312.5(b)(2), the email-plus method is valid only when a child&apos;s personal
              information is used <strong className="text-white/80">solely for internal operations</strong> and is not
              disclosed to third parties other than service providers acting on SparkForge&apos;s behalf under written
              agreements with equivalent safeguards (see Section 4).
            </p>

            <h3 className="font-display text-lg font-medium text-white/90 mb-2 mt-6">
              5b. Separate Consent for Third-Party Disclosure
            </h3>
            <p className="text-white/60">
              As amended by the FTC in 2025, COPPA requires <strong className="text-white/80">separate verifiable parental
              consent</strong> before any third-party disclosure of a child&apos;s personal information that is not covered
              by a service-provider relationship (e.g., targeted advertising, cross-service profiling, disclosure to data
              brokers). SparkForge does not currently engage in any such disclosures and therefore does not seek separate
              VPC beyond the email-plus method above. If this ever changes, we will obtain separate affirmative parental
              consent using a higher-bar VPC method (such as a verified payment-card transaction, government-ID match, or
              live video-call verification) before the new disclosure begins, and we will update this Privacy Policy and
              notify existing parents in advance.
            </p>
          </section>

          {/* ═══ Section 6: Parental Rights ═══ */}
          <section id="parental-rights">
            <h2 className="font-display text-xl font-semibold text-white mb-3">
              6. Parental Rights
            </h2>
            <p className="mb-4">
              Parents and legal guardians have the following rights under COPPA. You may exercise these rights at any time.
            </p>
            <div className="space-y-3">
              {[
                {
                  right: 'Review your child\u2019s information',
                  how: 'Log in to your Parent Dashboard to view all child profile data, progress, badges, and session history.',
                },
                {
                  right: 'Request deletion of your child\u2019s data',
                  how: 'Delete a child profile from the Parent Dashboard. All associated data (progress, sessions, prompt history, badges) is permanently removed via cascading deletion.',
                },
                {
                  right: 'Refuse further collection',
                  how: 'Delete the child profile or contact us to deactivate data collection while preserving the account.',
                },
                {
                  right: 'Revoke consent',
                  how: 'Contact privacy@sparkforge-labs.com or delete the child profile. We will cease all collection and delete existing data.',
                },
                {
                  right: 'Manage content filters and time limits',
                  how: 'Use the Parent Dashboard to set daily time limits, content filters, and review game activity.',
                },
              ].map((item) => (
                <div key={item.right} className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                  <p className="text-sm font-display font-medium text-white/80">{item.right}</p>
                  <p className="text-xs text-white/70 mt-1">{item.how}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-white/50">
              To verify your identity when exercising parental rights, we may ask you to confirm account credentials
              or respond to a verification email sent to your registered email address.
            </p>
          </section>

          {/* ═══ Section 7: Data Retention ═══ */}
          <section id="data-retention">
            <h2 className="font-display text-xl font-semibold text-white mb-3">
              7. Data Retention Policy
            </h2>
            <p className="mb-4">
              Per the 2025 COPPA amendments, we maintain a written data retention policy. We do not retain children&apos;s
              personal information indefinitely.
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-2 pr-4 font-display text-white/70 font-medium">Data Category</th>
                  <th className="text-left py-2 pr-4 font-display text-white/70 font-medium">Retention Period</th>
                  <th className="text-left py-2 font-display text-white/70 font-medium">Reason</th>
                </tr>
              </thead>
              <tbody className="text-white/50">
                <tr className="border-b border-white/[0.04]">
                  <td className="py-2 pr-4">Parent account data</td>
                  <td className="py-2 pr-4">Duration of account + 30 days after deletion</td>
                  <td className="py-2">Account recovery grace period</td>
                </tr>
                <tr className="border-b border-white/[0.04]">
                  <td className="py-2 pr-4">Child profile &amp; progress</td>
                  <td className="py-2 pr-4">Duration of profile + immediate deletion on removal</td>
                  <td className="py-2">Learning continuity; deleted on parent request</td>
                </tr>
                <tr className="border-b border-white/[0.04]">
                  <td className="py-2 pr-4">Prompt Lab history</td>
                  <td className="py-2 pr-4">Automatically purged daily (pg_cron job)</td>
                  <td className="py-2">COPPA minimization; AI responses are ephemeral</td>
                </tr>
                <tr className="border-b border-white/[0.04]">
                  <td className="py-2 pr-4">Session logs</td>
                  <td className="py-2 pr-4">90 days</td>
                  <td className="py-2">Parent dashboard reporting, time limit enforcement</td>
                </tr>
                <tr className="border-b border-white/[0.04]">
                  <td className="py-2 pr-4">Demo session data</td>
                  <td className="py-2 pr-4">Deleted at session expiry (1 hour maximum)</td>
                  <td className="py-2">Demo data is ephemeral by design</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Error monitoring (Sentry)</td>
                  <td className="py-2 pr-4">30 days (Sentry default retention)</td>
                  <td className="py-2">Bug detection; child PII is stripped before transmission</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-4 text-sm text-white/60">
              <strong className="text-white/80">Absolute maximum retention.</strong> Consistent with 16 CFR &sect; 312.10
              (as amended in 2025), no category of children&apos;s personal information is retained indefinitely. Except
              where a longer period is required by a specific legal obligation (for example, Stripe invoice records that
              must be retained for tax-audit purposes), the maximum retention for any child&apos;s personal information is
              three (3) years from the last active use of the associated account, after which the data is deleted or
              irreversibly de-identified.
            </p>
          </section>

          {/* ═══ Section 8: Data Security ═══ */}
          <section id="security">
            <h2 className="font-display text-xl font-semibold text-white mb-3">
              8. Data Security Program
            </h2>
            <p className="mb-4">
              Per the 2025 COPPA amendments, we maintain a written children&apos;s personal information security program
              with safeguards appropriate to the sensitivity of the data we collect. Our security measures include:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-white/60">
              <li>All data transmitted via TLS/HTTPS encryption</li>
              <li>Database encryption at rest (Supabase managed PostgreSQL)</li>
              <li>Row Level Security (RLS) policies on every database table &mdash; users can only access their own data</li>
              <li>Passwords stored using industry-standard cryptographic hashing (bcrypt via Supabase Auth)</li>
              <li>Rate limiting on all API endpoints to prevent abuse</li>
              <li>SECURITY DEFINER functions with locked search paths to prevent SQL injection</li>
              <li>Content Security Policy (CSP) headers to prevent cross-site scripting</li>
              <li>Multi-layer AI content moderation (regex pattern matching + LLM safety screening)</li>
              <li>Sentry error reporting configured to strip child PII before transmission</li>
              <li>Regular code audits and automated security testing</li>
            </ul>
            <p className="mt-4 text-sm text-white/50">
              We require all third-party service providers that receive children&apos;s data to maintain adequate security
              measures consistent with this policy.
            </p>

            <h3 className="font-display text-lg font-medium text-white/90 mb-2 mt-6">
              8a. Written Children&apos;s Information Security Program (2025 Amendment)
            </h3>
            <p className="text-white/60 mb-3">
              The 2025 COPPA amendments (16 CFR &sect; 312.8) require operators to establish, implement, and maintain a
              written children&apos;s personal information security program with safeguards appropriate to the sensitivity
              of the data, the operator&apos;s size, and its business activities. Our program includes:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-white/60">
              <li><strong className="text-white/80">Designated responsible party:</strong> the SparkForge LLC Privacy &amp; Security Lead identified in Section 1 holds documented accountability for the program and is the point of contact for all COPPA obligations.</li>
              <li><strong className="text-white/80">Annual risk assessment:</strong> at least once every twelve (12) months, we review the confidentiality, integrity, and availability risks to children&apos;s personal information and update safeguards accordingly.</li>
              <li><strong className="text-white/80">Written service-provider agreements:</strong> every third party that processes children&apos;s personal information on our behalf is under a written data-processing addendum (DPA) requiring security and confidentiality safeguards at least as protective as those in this Section 8.</li>
              <li><strong className="text-white/80">Incident response and breach notification:</strong> we maintain documented incident-response procedures and notify affected parents and applicable regulators within the timeframes required by the strictest applicable federal or state law (see Section 16).</li>
              <li><strong className="text-white/80">Access control and audit logging:</strong> access to systems holding children&apos;s PI is role-based, least-privilege, and logged; administrative access requires multi-factor authentication.</li>
            </ul>
          </section>

          {/* ═══ Section 9: Cookies & Persistent Identifiers ═══ */}
          <section id="cookies">
            <h2 className="font-display text-xl font-semibold text-white mb-3">
              9. Cookies &amp; Persistent Identifiers
            </h2>
            <p className="mb-4">
              SparkForge uses a limited set of cookies and persistent identifiers strictly for &quot;support for internal
              operations&quot; as defined under COPPA. We do <strong className="text-white/90">not</strong> use cookies or
              persistent identifiers for behavioral advertising, user profiling, or cross-site tracking.
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-2 pr-4 font-display text-white/70 font-medium">Cookie/Identifier</th>
                  <th className="text-left py-2 pr-4 font-display text-white/70 font-medium">Purpose</th>
                  <th className="text-left py-2 font-display text-white/70 font-medium">Duration</th>
                </tr>
              </thead>
              <tbody className="text-white/50">
                <tr className="border-b border-white/[0.04]">
                  <td className="py-2 pr-4">Supabase auth cookies</td>
                  <td className="py-2 pr-4">Maintain authenticated session</td>
                  <td className="py-2">Session / 7 days (refresh token)</td>
                </tr>
                <tr className="border-b border-white/[0.04]">
                  <td className="py-2 pr-4">sparkforge-active-child</td>
                  <td className="py-2 pr-4">Remember which child profile was last selected</td>
                  <td className="py-2">Persistent (localStorage)</td>
                </tr>
                <tr className="border-b border-white/[0.04]">
                  <td className="py-2 pr-4">sparkforge-demo-active</td>
                  <td className="py-2 pr-4">Indicate an active demo session</td>
                  <td className="py-2">1 hour (session expiry)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">sparkforge-skip-intro</td>
                  <td className="py-2 pr-4">User preference to skip the intro animation</td>
                  <td className="py-2">Persistent (localStorage)</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-4 text-sm text-white/70">
              We do not use any analytics cookies, advertising pixels, or third-party tracking scripts.
            </p>
          </section>

          {/* ═══ Section 10: Advertising & Monetization ═══ */}
          <section id="advertising">
            <h2 className="font-display text-xl font-semibold text-white mb-3">
              10. Advertising &amp; Monetization
            </h2>
            <div className="p-4 rounded-lg bg-spark-blue/5 border border-spark-blue/20">
              <p className="text-sm text-white/70">
                <strong className="text-white/90">SparkForge does not display advertising of any kind.</strong> We do not
                serve behavioral ads, contextual ads, or sponsored content. Children&apos;s data is never sold, licensed,
                or shared for advertising or marketing purposes. Our sole revenue model is parent-paid subscriptions
                processed through Stripe.
              </p>
            </div>
          </section>

          {/* ═══ Section 11: Demo Mode ═══ */}
          <section id="demo">
            <h2 className="font-display text-xl font-semibold text-white mb-3">
              11. Demo Mode
            </h2>
            <p>
              SparkForge offers a demo mode that allows exploration without account creation. During a demo session:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-white/60 mt-3">
              <li>Sessions are limited to 1 hour maximum</li>
              <li>No personal information is collected or stored</li>
              <li>A temporary session cookie (<code className="text-xs bg-white/[0.06] px-1 py-0.5 rounded">sparkforge-demo-active</code>) tracks session timing only</li>
              <li>All demo session data is discarded when the session expires</li>
              <li>Game progress, XP, and achievements are not saved</li>
            </ul>
          </section>

          {/* ═══ Section 12: Changes to This Policy ═══ */}
          <section id="changes">
            <h2 className="font-display text-xl font-semibold text-white mb-3">
              12. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy to reflect changes in our practices or applicable law. If we make
              material changes that affect how we collect, use, or disclose children&apos;s personal information, we will:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-white/60 mt-3">
              <li>Post the updated policy on this page with a new effective date</li>
              <li>Send email notification to all registered parent accounts</li>
              <li>Obtain new parental consent before applying material changes to existing child data</li>
            </ul>
          </section>

          {/* ═══ Section 13: Contact ═══ */}
          <section id="contact">
            <h2 className="font-display text-xl font-semibold text-white mb-3">
              13. Contact Us
            </h2>
            <p className="mb-4">
              For privacy-related inquiries, parental rights requests, or COPPA-related questions:
            </p>
            <div className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <p className="text-sm text-white/60">
                <strong className="text-white/80">SparkForge LLC &mdash; Privacy Team</strong><br />
                Mailing address: <span className="text-white/70">[MAILING ADDRESS &mdash; to be finalized before production launch]</span><br />
                Telephone: <a href="tel:+17736292320" className="text-spark-blue hover:underline">(773) 629-2320</a><br />
                Email: <a href="mailto:privacy@sparkforge-labs.com" className="text-spark-blue hover:underline">privacy@sparkforge-labs.com</a><br />
                Subject line: &quot;COPPA Privacy Request&quot; or &quot;Parental Rights Request&quot;
              </p>
              <p className="text-xs text-white/70 mt-3">
                We will respond to all parental rights requests within 10 business days. You may also file a complaint
                with the Federal Trade Commission at{' '}
                <a href="https://www.ftc.gov/complaint" className="text-spark-blue hover:underline" target="_blank" rel="noopener noreferrer">
                  ftc.gov/complaint
                </a>.
              </p>
            </div>
          </section>

          {/* ═══ Section 14: State Privacy Law Disclosures ═══ */}
          <section id="state-laws">
            <h2 className="font-display text-xl font-semibold text-white mb-3">
              14. State Privacy Law Disclosures
            </h2>
            <p className="mb-4">
              In addition to the federal protections above, residents of certain U.S. states have additional rights under
              comprehensive state privacy laws and state-specific children&apos;s/teens&apos; codes. The table below
              summarizes applicability; the California and Maryland subsections below describe rights in greater detail.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left py-2 pr-4 font-display text-white/70 font-medium">State</th>
                    <th className="text-left py-2 pr-4 font-display text-white/70 font-medium">Key Law(s)</th>
                    <th className="text-left py-2 font-display text-white/70 font-medium">Resident Rights (adults and minors)</th>
                  </tr>
                </thead>
                <tbody className="text-white/60">
                  <tr className="border-b border-white/[0.04]">
                    <td className="py-2 pr-4 align-top">California</td>
                    <td className="py-2 pr-4 align-top">CCPA/CPRA; SOPIPA; AB 1584; AB 2273 (AADC)</td>
                    <td className="py-2 align-top">Know, access, delete, correct, opt-out of sale/share, limit use of sensitive PI, non-discrimination; under-18 design-code protections.</td>
                  </tr>
                  <tr className="border-b border-white/[0.04]">
                    <td className="py-2 pr-4 align-top">Maryland</td>
                    <td className="py-2 pr-4 align-top">MODPA; MD AADC (HB 603)</td>
                    <td className="py-2 align-top">Know, delete, correct, portability; privacy-by-default for users under 18; DPIA required.</td>
                  </tr>
                  <tr className="border-b border-white/[0.04]">
                    <td className="py-2 pr-4 align-top">Virginia</td>
                    <td className="py-2 pr-4 align-top">VCDPA</td>
                    <td className="py-2 align-top">Access, delete, correct, portability; COPPA-style VPC for known under-13 data.</td>
                  </tr>
                  <tr className="border-b border-white/[0.04]">
                    <td className="py-2 pr-4 align-top">Colorado</td>
                    <td className="py-2 pr-4 align-top">CPA; SB 24-041</td>
                    <td className="py-2 align-top">Access, delete, correct, portability, opt-out; no targeted ads, profiling, or sale involving users under 18 without proper consent.</td>
                  </tr>
                  <tr className="border-b border-white/[0.04]">
                    <td className="py-2 pr-4 align-top">Connecticut</td>
                    <td className="py-2 pr-4 align-top">CTDPA (with minors amendment)</td>
                    <td className="py-2 align-top">Access, delete, correct, portability; duty of care for users 13&ndash;17; ban on targeted ads and sale of teen data regardless of consent.</td>
                  </tr>
                  <tr className="border-b border-white/[0.04]">
                    <td className="py-2 pr-4 align-top">Oregon</td>
                    <td className="py-2 pr-4 align-top">OCPA; HB 2008</td>
                    <td className="py-2 align-top">Access, delete, correct, portability; targeted-advertising prohibition for ages 13&ndash;15 under actual-knowledge / willful-disregard.</td>
                  </tr>
                  <tr className="border-b border-white/[0.04]">
                    <td className="py-2 pr-4 align-top">Texas</td>
                    <td className="py-2 pr-4 align-top">TDPSA</td>
                    <td className="py-2 align-top">Access, delete, correct, portability; heightened disclosures and opt-ins for known minors.</td>
                  </tr>
                  <tr className="border-b border-white/[0.04]">
                    <td className="py-2 pr-4 align-top">Utah</td>
                    <td className="py-2 pr-4 align-top">UCPA</td>
                    <td className="py-2 align-top">Access, delete, portability, opt-out of sale and targeted advertising.</td>
                  </tr>
                  <tr className="border-b border-white/[0.04]">
                    <td className="py-2 pr-4 align-top">Delaware</td>
                    <td className="py-2 pr-4 align-top">DPDPA</td>
                    <td className="py-2 align-top">Access, delete, correct, portability, opt-out; honors Global Privacy Control.</td>
                  </tr>
                  <tr className="border-b border-white/[0.04]">
                    <td className="py-2 pr-4 align-top">New York</td>
                    <td className="py-2 pr-4 align-top">SHIELD Act; NY Child Data Protection Act (CDPA)</td>
                    <td className="py-2 align-top">Reasonable-security obligations; restrictions on processing data of users under 18.</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 align-top">Other states</td>
                    <td className="py-2 pr-4 align-top">IA, NE, NH, NJ, MN, RI, IN, KY, TN, MT, FL</td>
                    <td className="py-2 align-top">General access/delete/correct/portability/opt-out equivalents; honored for any resident who requests them.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="font-display text-lg font-medium text-white/90 mb-2 mt-6">
              14a. Notice to California Residents (CCPA/CPRA)
            </h3>
            <p className="text-white/60 mb-3">
              California residents (parent account holders and, where applicable, teens aged 13&ndash;17 via a parent)
              have the following rights under the California Consumer Privacy Act as amended by the California Privacy
              Rights Act:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-white/60 mb-3">
              <li><strong className="text-white/80">Right to know</strong> what personal information we have collected, the sources, the purposes, and the categories of third parties to whom it was disclosed.</li>
              <li><strong className="text-white/80">Right to access</strong> a portable copy of the personal information we hold about you.</li>
              <li><strong className="text-white/80">Right to delete</strong> personal information, subject to a narrow set of statutory exceptions.</li>
              <li><strong className="text-white/80">Right to correct</strong> inaccurate personal information.</li>
              <li><strong className="text-white/80">Right to opt-out of sale or sharing</strong> of personal information. <span className="text-white/80">SparkForge does not sell or share personal information as defined under the CCPA/CPRA.</span></li>
              <li><strong className="text-white/80">Right to limit use of sensitive personal information.</strong> SparkForge does not use sensitive personal information beyond the narrow business purposes permitted by Cal. Code Regs. tit. 11, &sect; 7027(l).</li>
              <li><strong className="text-white/80">Right to non-discrimination</strong> for exercising any of these rights.</li>
            </ul>
            <p className="text-white/60 mb-3">
              <strong className="text-white/80">Global Privacy Control (GPC):</strong> SparkForge honors the GPC browser
              signal. Because we do not sell or share personal information, GPC has no additional effect on our primary data
              flows; however, we treat GPC as an opt-out signal for any future analytics or advertising integrations.
            </p>
            <p className="text-white/60">
              Submit California rights requests by email to{' '}
              <a href="mailto:privacy@sparkforge-labs.com" className="text-spark-blue hover:underline">privacy@sparkforge-labs.com</a>{' '}
              or by the Parental Rights page at{' '}
              <Link href="/privacy/rights" className="text-spark-blue hover:underline">/privacy/rights</Link>. We will verify
              identity (as described on that page) and respond within 45 days, extendable once by 45 days when reasonably
              necessary with notice.
            </p>

            <h3 className="font-display text-lg font-medium text-white/90 mb-2 mt-6">
              14b. Notice to Maryland Residents (MD AADC)
            </h3>
            <p className="text-white/60">
              Under the Maryland Age-Appropriate Design Code Act (HB 603), SparkForge configures default privacy settings
              to the highest level of privacy for users under 18, collects only the minimum personal data needed, does not
              use dark patterns that encourage minors to weaken privacy settings, and maintains a Data Protection Impact
              Assessment (DPIA) for features reasonably likely to be accessed by minors.
            </p>
          </section>

          {/* ═══ Section 15: International Users & Cross-Border Transfers ═══ */}
          <section id="international">
            <h2 className="font-display text-xl font-semibold text-white mb-3">
              15. International Users &amp; Cross-Border Transfers
            </h2>

            <h3 className="font-display text-lg font-medium text-white/90 mb-2">
              15a. Primary Audience and Data Location
            </h3>
            <p className="text-white/60 mb-3">
              SparkForge is operated from the United States by an Illinois limited liability company and is primarily
              intended for users physically located in the United States. Personal information processed by SparkForge is
              stored in the United States using Supabase-managed infrastructure (AWS US regions). Certain operational
              telemetry is also processed in the United States by our service providers (see Section 4).
            </p>

            <h3 className="font-display text-lg font-medium text-white/90 mb-2 mt-6">
              15b. Use of the Service from Outside the United States
            </h3>
            <p className="text-white/60 mb-3">
              If you access SparkForge from outside the United States, you understand that your personal information will
              be transferred to and processed in the United States. U.S. data-protection law may differ from the law of
              your country of residence. By using SparkForge from outside the United States, you consent to this transfer
              and processing. Where we are required to implement a specific transfer safeguard for your jurisdiction, we
              rely on the mechanism described below.
            </p>

            <h3 className="font-display text-lg font-medium text-white/90 mb-2 mt-6">
              15c. Transfer Safeguards (EU/EEA, United Kingdom, Switzerland)
            </h3>
            <ul className="list-disc list-inside space-y-1.5 text-white/60 mb-3">
              <li><strong className="text-white/80">Standard Contractual Clauses (SCCs).</strong> Where applicable, transfers of personal data from the EU/EEA to the United States rely on the European Commission&apos;s 2021 Standard Contractual Clauses, executed with each service provider that receives such data on our behalf.</li>
              <li><strong className="text-white/80">UK International Data Transfer Addendum (IDTA).</strong> Transfers from the United Kingdom rely on the ICO-issued IDTA, appended to the SCCs where the relevant service provider supports it.</li>
              <li><strong className="text-white/80">EU&ndash;U.S. Data Privacy Framework (DPF).</strong> Where a service provider is certified under the DPF, we additionally rely on that certification as an adequate transfer mechanism.</li>
              <li><strong className="text-white/80">Transfer impact assessments.</strong> For each service provider that processes data of EU/EEA, UK, or Swiss residents, we maintain a transfer-impact assessment (post-<em>Schrems II</em>) that considers U.S. surveillance-law exposure and supplemental measures (end-to-end encryption, jurisdictional data residency where available, and minimum-necessary data sharing).</li>
            </ul>

            <h3 className="font-display text-lg font-medium text-white/90 mb-2 mt-6">
              15d. Digital Consent Age (GDPR Article 8)
            </h3>
            <p className="text-white/60 mb-3">
              Under Article 8 of the EU General Data Protection Regulation, the age at which a child can provide their own
              consent to information-society services defaults to 16 and may be lowered by each Member State (typically to
              13, 14, or 15 depending on jurisdiction). SparkForge is designed so that a parent or legal guardian is the
              contracting party regardless of the child&apos;s age, which satisfies the parental-authorization prong of
              GDPR Article 8 where that prong applies. Teens aged 13&ndash;17 in the United Kingdom and EU/EEA retain the
              data-subject rights described in Section 15f below.
            </p>

            <h3 className="font-display text-lg font-medium text-white/90 mb-2 mt-6">
              15e. Canada &amp; Australia
            </h3>
            <p className="text-white/60 mb-3">
              Canadian residents are protected by the Personal Information Protection and Electronic Documents Act
              (PIPEDA), and, in Quebec, Law 25. Australian residents are protected by the Privacy Act 1988. Where these
              laws apply, we implement equivalent rights of access, correction, and deletion, and we process complaints
              through the same Parental Rights workflow described in Section 6 and at{' '}
              <Link href="/privacy/rights" className="text-spark-blue hover:underline">/privacy/rights</Link>.
            </p>

            <h3 className="font-display text-lg font-medium text-white/90 mb-2 mt-6">
              15f. Data Subject Rights for International Users
            </h3>
            <p className="text-white/60 mb-3">
              Regardless of where you are located, you have the right to access, correct, delete, or port the personal
              information we hold about you or your child, and to object to or restrict certain processing. You may
              withdraw consent at any time. These rights are subject to narrow exceptions permitted by applicable law.
              Submit requests through{' '}
              <Link href="/privacy/rights" className="text-spark-blue hover:underline">/privacy/rights</Link>{' '}
              or by email to{' '}
              <a href="mailto:privacy@sparkforge-labs.com" className="text-spark-blue hover:underline">privacy@sparkforge-labs.com</a>.
            </p>
            <p className="text-sm text-white/50">
              EU/EEA and UK residents have the additional right to lodge a complaint with a supervisory authority. A list
              of EU/EEA data-protection authorities is available at{' '}
              <a href="https://edpb.europa.eu/about-edpb/about-edpb/members_en" target="_blank" rel="noopener noreferrer" className="text-spark-blue hover:underline">
                edpb.europa.eu
              </a>
              ; the UK Information Commissioner&apos;s Office is at{' '}
              <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-spark-blue hover:underline">
                ico.org.uk
              </a>.
            </p>
          </section>

          {/* Legal review notice */}
          <div className="mt-12 p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <p className="text-xs text-amber-400/70 font-body">
              <strong className="text-amber-400/90">LEGAL REVIEW REQUIRED:</strong> This privacy policy has been drafted
              to cover all FTC COPPA requirements including the 2025 amendments (compliance deadline April 22, 2026).
              It should be reviewed by qualified legal counsel before production deployment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
