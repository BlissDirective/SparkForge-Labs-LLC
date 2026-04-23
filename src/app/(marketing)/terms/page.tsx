import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service — SparkForge',
  description:
    'SparkForge terms of service. Rules and guidelines for using our children\'s AI learning platform.',
};

// ════════════════════════════════════════════════════
// TERMS OF SERVICE — Children's Educational Platform
// Covers: Account terms, subscriptions, acceptable use, AI disclosures,
//         COPPA alignment, demo mode, IP, liability, dispute resolution
// LEGAL REVIEW REQUIRED before production launch.
// ════════════════════════════════════════════════════

export default function TermsPage() {
  return (
    <div className="pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-6">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-block px-3 py-1 rounded-full bg-spark-purple/10 border border-spark-purple/20 text-spark-purple text-xs font-data uppercase tracking-wider mb-4">
            Platform Agreement
          </div>
          <h1 className="font-display text-4xl font-bold mb-3 bg-gradient-to-r from-spark-blue to-spark-purple bg-clip-text text-transparent">
            Terms of Service
          </h1>
          <p className="text-white/70 font-body">
            Effective Date: March 30, 2026 &middot; Last Updated: March 30, 2026
          </p>
        </div>

        <div className="space-y-10 font-body text-white/70 leading-relaxed">
          {/* ═══ Section 1: Acceptance ═══ */}
          <section id="acceptance">
            <h2 className="font-display text-xl font-semibold text-white mb-3">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using SparkForge (&quot;the Platform&quot;), you agree to be bound by these Terms of Service
              (&quot;Terms&quot;). If you are a parent or legal guardian creating an account on behalf of a child, you accept
              these Terms on behalf of yourself and your child. If you do not agree to these Terms, do not use the Platform.
            </p>
            <p className="mt-3">
              These Terms are governed by and should be read in conjunction with our{' '}
              <Link href="/privacy" className="text-spark-blue hover:underline">Privacy Policy</Link>,
              which describes how we collect, use, and protect personal information.
            </p>
          </section>

          {/* ═══ Section 2: Eligibility & Age ═══ */}
          <section id="eligibility">
            <h2 className="font-display text-xl font-semibold text-white mb-3">
              2. Eligibility &amp; Age Requirements
            </h2>
            <p className="mb-3">
              SparkForge is designed for children ages 7&ndash;16 and their parents/guardians. The following eligibility
              requirements apply:
            </p>
            <ul className="list-disc list-inside space-y-2 text-white/60">
              <li>
                <strong className="text-white/80">Parent/guardian accounts:</strong> You must be at least 18 years old
                to create a parent account. By creating an account, you represent and warrant that you are at least 18 years of age.
              </li>
              <li>
                <strong className="text-white/80">Child profiles:</strong> Only a registered parent/guardian can create
                child profiles. Children cannot self-register or create accounts independently.
              </li>
              <li>
                <strong className="text-white/80">COPPA consent:</strong> For children under 13, we require verifiable
                parental consent before any personal information is collected, as described in our{' '}
                <Link href="/privacy#consent" className="text-spark-blue hover:underline">Privacy Policy</Link>.
              </li>
              <li>
                <strong className="text-white/80">Age bands:</strong> Content difficulty is adapted based on age bands
                (A: 7&ndash;9, B: 10&ndash;12, C: 13&ndash;16). The parent sets the age band during profile creation.
              </li>
            </ul>
          </section>

          {/* ═══ Section 3: Account Terms ═══ */}
          <section id="accounts">
            <h2 className="font-display text-xl font-semibold text-white mb-3">
              3. Account Terms
            </h2>
            <ul className="list-disc list-inside space-y-2 text-white/60">
              <li>You are responsible for maintaining the confidentiality and security of your account credentials.</li>
              <li>You must provide accurate and complete information during registration.</li>
              <li>You are responsible for all activity that occurs under your account, including actions taken by child users on profiles you created.</li>
              <li>Each parent account may create multiple child profiles (1 on Free, 3 on Plus, 5 on Forge tier).</li>
              <li>You must notify us immediately at{' '}
                <a href="mailto:support@sparkforge-labs.com" className="text-spark-blue hover:underline">support@sparkforge-labs.com</a>{' '}
                if you believe your account has been compromised.
              </li>
              <li>We reserve the right to suspend or terminate accounts that violate these Terms or engage in prohibited activity.</li>
            </ul>
          </section>

          {/* ═══ Section 4: Subscriptions & Payments ═══ */}
          <section id="subscriptions">
            <h2 className="font-display text-xl font-semibold text-white mb-3">
              4. Subscriptions &amp; Payments
            </h2>
            <h3 className="font-display text-lg font-medium text-white/90 mb-2">4a. Subscription Tiers</h3>
            <div className="space-y-3 mb-4">
              {[
                { tier: 'Free', desc: 'Access to Labs 1\u20133, 3 games per week, 1 child profile, 5 Prompt Lab tries/day.' },
                { tier: 'Plus', desc: 'Full access to all 10 labs and 35 games, unlimited play, 3 child profiles, 50 Prompt Lab tries/day, parent progress reports.' },
                { tier: 'Forge', desc: 'All Plus features, plus 5 child profiles, 200 Prompt Lab tries/day, AI-generated content, early access to new content, and priority support.' },
              ].map((t) => (
                <div key={t.tier} className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                  <p className="text-sm"><strong className="text-white/80">{t.tier}:</strong>{' '}
                    <span className="text-white/50">{t.desc}</span>
                  </p>
                </div>
              ))}
            </div>

            <h3 className="font-display text-lg font-medium text-white/90 mb-2">4b. Billing &amp; Payment</h3>
            <ul className="list-disc list-inside space-y-1.5 text-white/60 mb-4">
              <li>Paid subscriptions (Plus, Forge) are billed monthly or annually via Stripe.</li>
              <li>All payments are processed by <strong className="text-white/80">Stripe</strong>, a PCI DSS Level 1 compliant payment processor. SparkForge never stores your credit card number.</li>
              <li>Subscriptions automatically renew at the end of each billing period unless canceled.</li>
              <li>You may cancel your subscription at any time through the Parent Dashboard. Cancellation takes effect at the end of the current billing period.</li>
            </ul>

            <h3 className="font-display text-lg font-medium text-white/90 mb-2">4c. Parental Gate for Purchases</h3>
            <p className="text-white/60">
              All subscription purchases, upgrades, and payment method changes require parent account authentication.
              Children cannot initiate, modify, or complete any financial transaction on SparkForge. The subscription
              management interface is accessible only through the authenticated Parent Dashboard.
            </p>

            <h3 className="font-display text-lg font-medium text-white/90 mt-4 mb-2">4d. Refunds</h3>
            <p className="text-white/60">
              Refund requests are evaluated on a case-by-case basis. Contact{' '}
              <a href="mailto:support@sparkforge-labs.com" className="text-spark-blue hover:underline">support@sparkforge-labs.com</a>{' '}
              within 14 days of a charge to request a refund. Refunds are processed through Stripe per their standard policies.
            </p>
          </section>

          {/* ═══ Section 5: Demo Mode ═══ */}
          <section id="demo">
            <h2 className="font-display text-xl font-semibold text-white mb-3">
              5. Demo Mode
            </h2>
            <p>
              SparkForge offers a demo mode that allows exploration without account creation, subject to the following terms:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-white/60 mt-3">
              <li>Demo sessions are limited to <strong className="text-white/80">1 hour maximum</strong>.</li>
              <li>No personal information is collected during demo sessions.</li>
              <li>All game progress, XP, and achievements earned during a demo are <strong className="text-white/80">not saved</strong> and are discarded when the session expires.</li>
              <li>A temporary browser cookie tracks session timing only and is deleted at expiry.</li>
              <li>Demo users have access to the full platform experience but cannot save state or create profiles.</li>
              <li>No Prompt Lab interactions are available in demo mode.</li>
            </ul>
          </section>

          {/* ═══ Section 6: Acceptable Use ═══ */}
          <section id="acceptable-use">
            <h2 className="font-display text-xl font-semibold text-white mb-3">
              6. Acceptable Use Policy
            </h2>
            <p className="mb-3">You and any child users under your account agree not to:</p>
            <ul className="list-disc list-inside space-y-1.5 text-white/60">
              <li>Attempt to bypass authentication, security measures, rate limits, or parental controls</li>
              <li>Use the Platform for any purpose other than educational learning</li>
              <li>Submit harmful, abusive, threatening, obscene, or otherwise inappropriate content through AI prompts or any input field</li>
              <li>Attempt to extract personal information from other users</li>
              <li>Use automated tools, bots, scrapers, or scripts to access the Platform</li>
              <li>Reverse-engineer, decompile, disassemble, or extract source code from the Platform</li>
              <li>Share account credentials with unauthorized users</li>
              <li>Circumvent subscription tier restrictions or content paywalls</li>
              <li>Upload or transmit malware, viruses, or other malicious code</li>
              <li>Interfere with the operation, performance, or availability of the Platform</li>
            </ul>
            <p className="mt-3 text-sm text-white/50">
              Violations of this Acceptable Use Policy may result in temporary suspension or permanent termination of
              your account, at our sole discretion. We will notify the parent account holder before taking action, except
              in cases involving immediate safety risks.
            </p>
          </section>

          {/* ═══ Section 7: AI Content ═══ */}
          <section id="ai-content">
            <h2 className="font-display text-xl font-semibold text-white mb-3">
              7. AI-Generated Content &amp; Disclosures
            </h2>
            <p className="mb-3">
              SparkForge uses artificial intelligence powered by the <strong className="text-white/80">Anthropic Claude API</strong> to
              generate educational content. The following disclosures apply:
            </p>
            <ul className="list-disc list-inside space-y-2 text-white/60">
              <li>
                <strong className="text-white/80">What data is sent to AI:</strong> Only text prompts submitted by the user
                in the Prompt Lab game (available to age band C / ages 14&ndash;16 only). No child profile data, names,
                or identifying information is sent to the API.
              </li>
              <li>
                <strong className="text-white/80">Content moderation:</strong> All AI interactions are screened through
                two-layer moderation: (1) regex pattern matching for prohibited content, and (2) LLM safety screening via
                Anthropic&apos;s Claude Haiku model. Content that fails either layer is blocked before delivery.
              </li>
              <li>
                <strong className="text-white/80">Content accuracy:</strong> AI-generated content may contain errors or
                inaccuracies. SparkForge is an educational supplement, not a replacement for formal education or professional advice.
              </li>
              <li>
                <strong className="text-white/80">No profiling:</strong> AI interactions are not used to build user profiles,
                serve advertisements, or make automated decisions about children. Prompt history is automatically purged daily.
              </li>
              <li>
                <strong className="text-white/80">Agent-generated content:</strong> Our content agent generates game scenarios,
                challenges, and educational material. All agent output goes through human (admin) review before publication.
              </li>
            </ul>
          </section>

          {/* ═══ Section 8: Advertising ═══ */}
          <section id="advertising">
            <h2 className="font-display text-xl font-semibold text-white mb-3">
              8. Advertising &amp; Monetization
            </h2>
            <div className="p-4 rounded-lg bg-spark-blue/5 border border-spark-blue/20">
              <p className="text-sm text-white/70">
                <strong className="text-white/90">SparkForge does not display any advertising.</strong> We do not serve
                behavioral ads, contextual ads, sponsored content, or in-game advertisements. We do not sell, license,
                or monetize children&apos;s data in any way. Our sole revenue model is parent-paid subscriptions.
              </p>
            </div>
          </section>

          {/* ═══ Section 9: IP ═══ */}
          <section id="ip">
            <h2 className="font-display text-xl font-semibold text-white mb-3">
              9. Intellectual Property
            </h2>
            <ul className="list-disc list-inside space-y-2 text-white/60">
              <li>
                All content, design, code, graphics, game mechanics, educational curriculum, 3D assets, and audio on
                SparkForge are owned by SparkForge LLC or its licensors and are protected by copyright and other
                intellectual property laws.
              </li>
              <li>
                You may not reproduce, distribute, modify, create derivative works of, or publicly display any
                SparkForge content without prior written permission.
              </li>
              <li>
                Content created by children within the Platform (e.g., Prompt Lab responses, classifier labels) remains
                the property of the user. We do not claim ownership of user-generated content.
              </li>
              <li>
                The SparkForge name, logo, and &quot;AI Learning Lab&quot; tagline are trademarks of SparkForge LLC.
              </li>
            </ul>
          </section>

          {/* ═══ Section 10: Termination ═══ */}
          <section id="termination">
            <h2 className="font-display text-xl font-semibold text-white mb-3">
              10. Termination
            </h2>
            <h3 className="font-display text-lg font-medium text-white/90 mb-2">10a. By You</h3>
            <p className="text-white/60 mb-3">
              You may delete your account and all associated child profiles at any time through the Parent Dashboard
              or by contacting <a href="mailto:support@sparkforge-labs.com" className="text-spark-blue hover:underline">support@sparkforge-labs.com</a>.
              Upon account deletion, all associated data is permanently removed in accordance with our{' '}
              <Link href="/privacy#data-retention" className="text-spark-blue hover:underline">Data Retention Policy</Link>.
            </p>

            <h3 className="font-display text-lg font-medium text-white/90 mb-2">10b. By Us</h3>
            <p className="text-white/60">
              We reserve the right to suspend or terminate accounts that violate these Terms, engage in prohibited activity,
              or pose a safety risk to other users. Where practicable, we will provide notice before termination and offer
              an opportunity to export data. In cases of immediate safety risk, we may act without prior notice.
            </p>
          </section>

          {/* ═══ Section 11: Disclaimers ═══ */}
          <section id="disclaimers">
            <h2 className="font-display text-xl font-semibold text-white mb-3">
              11. Disclaimers &amp; Limitation of Liability
            </h2>
            <p className="text-white/60 mb-3">
              SparkForge is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either express or
              implied, including but not limited to implied warranties of merchantability, fitness for a particular
              purpose, and non-infringement.
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-white/60 mb-3">
              <li>SparkForge is an educational supplement, not a substitute for formal education, tutoring, or professional academic guidance.</li>
              <li>We do not guarantee uninterrupted or error-free operation of the Platform.</li>
              <li>AI-generated content may contain inaccuracies and should not be relied upon as authoritative.</li>
            </ul>
            <p className="text-white/60">
              To the maximum extent permitted by applicable law, SparkForge LLC shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages arising out of or relating to your use of SparkForge.
              Our total aggregate liability shall not exceed the amount paid by you in the 12 months preceding any claim.
            </p>
          </section>

          {/* ═══ Section 12: Dispute Resolution ═══ */}
          <section id="disputes">
            <h2 className="font-display text-xl font-semibold text-white mb-3">
              12. Dispute Resolution &amp; Governing Law
            </h2>
            <p className="text-white/60 mb-3">
              These Terms are governed by and construed in accordance with the laws of the State of Illinois, United States,
              without regard to conflict of law provisions. SparkForge LLC is organized as an Illinois limited liability company.
            </p>
            <p className="text-white/60 mb-3">
              Any dispute arising from these Terms or your use of SparkForge shall first be addressed through good-faith
              negotiation. If negotiation fails, disputes shall be resolved through binding arbitration administered by
              JAMS under its Streamlined Arbitration Rules, conducted remotely (online or by phone).
            </p>
            <p className="text-sm text-white/70">
              Nothing in this section limits your right to file a complaint with the Federal Trade Commission or your
              state&apos;s attorney general regarding COPPA compliance.
            </p>
          </section>

          {/* ═══ Section 13: Changes ═══ */}
          <section id="changes">
            <h2 className="font-display text-xl font-semibold text-white mb-3">
              13. Changes to These Terms
            </h2>
            <p className="text-white/60">
              We may update these Terms from time to time. If we make material changes, we will:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-white/60 mt-3">
              <li>Post the updated Terms on this page with a new effective date</li>
              <li>Send email notification to all registered parent accounts</li>
              <li>Where changes materially affect children&apos;s data practices, obtain new parental consent before applying changes</li>
            </ul>
            <p className="mt-3 text-white/60">
              Continued use of SparkForge after changes take effect constitutes acceptance of the revised Terms.
            </p>
          </section>

          {/* ═══ Section 14: Contact ═══ */}
          <section id="contact">
            <h2 className="font-display text-xl font-semibold text-white mb-3">
              14. Contact
            </h2>
            <div className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <p className="text-sm text-white/60">
                <strong className="text-white/80">SparkForge LLC</strong> <span className="text-white/40">(an Illinois limited liability company)</span><br />
                Mailing address: <span className="text-white/70">[MAILING ADDRESS &mdash; to be finalized before production launch]</span><br />
                Telephone: <a href="tel:+17736292320" className="text-spark-blue hover:underline">(773) 629-2320</a><br />
                General inquiries: <a href="mailto:support@sparkforge-labs.com" className="text-spark-blue hover:underline">support@sparkforge-labs.com</a><br />
                Privacy &amp; COPPA: <a href="mailto:privacy@sparkforge-labs.com" className="text-spark-blue hover:underline">privacy@sparkforge-labs.com</a><br />
                Legal: <a href="mailto:legal@sparkforge-labs.com" className="text-spark-blue hover:underline">legal@sparkforge-labs.com</a>
              </p>
            </div>
          </section>

          {/* Legal review notice */}
          <div className="mt-12 p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <p className="text-xs text-amber-400/70 font-body">
              <strong className="text-amber-400/90">LEGAL REVIEW REQUIRED:</strong> These terms of service have been
              drafted to cover standard requirements for a children&apos;s educational platform with AI features, COPPA
              alignment, and subscription billing. They should be reviewed by qualified legal counsel before production deployment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
