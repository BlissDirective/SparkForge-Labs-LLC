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

            <h3 className="font-display text-lg font-medium text-white/90 mt-4 mb-2">4d. Refunds &amp; Cancellation</h3>
            <p className="text-white/60 mb-3">
              You can cancel any subscription at any time from your parent dashboard.
              Cancellation stops auto-renewal immediately and your access continues
              until the end of the current billing period. There are no cancellation fees.
            </p>
            <p className="text-white/60 mb-3">
              <strong className="text-white/80">30-day money-back guarantee.</strong> We refund the first paid period in full
              (monthly or annual) when requested within 30 days of that initial charge.
              Email{' '}
              <a href="mailto:support@sparkforge-labs.com" className="text-spark-blue hover:underline">support@sparkforge-labs.com</a>{' '}
              from the parent account on file.
            </p>
            <p className="text-white/60 mb-3">
              <strong className="text-white/80">Annual cancellations after the 30-day window.</strong> After 30 days,
              annual plans are not refundable in cash. If you cancel mid-year, we will credit
              your SparkForge account for the unused months at the monthly-equivalent rate.
              The credit applies to any future SparkForge charge on your account and never
              expires.
            </p>
            <p className="text-white/60 mb-3">
              <strong className="text-white/80">Plan changes.</strong> Switching tiers
              (e.g. Forge &rarr; Plus) or cadence (monthly &rarr; annual) is pro-rated automatically by Stripe.
              Unused time on the old plan is credited toward the new one. No refund is issued
              because the subscription continues.
            </p>
            <p className="text-white/60">
              <strong className="text-white/80">Goodwill exceptions.</strong> We will always refund: (a) duplicate
              charges, (b) charges that occur after a successful cancellation, (c) charges
              during a documented platform outage longer than 24 hours, (d) charges to a card
              you reasonably believe was used without authorization. Other situations are
              reviewed individually within 5 business days.
            </p>

            <h3 className="font-display text-lg font-medium text-white/90 mt-6 mb-2">
              4e. Automatic Renewal Disclosures (ROSCA &amp; California ARL)
            </h3>
            <p className="text-white/60 mb-3">
              This section is provided to satisfy the federal Restore Online Shoppers&apos; Confidence Act (ROSCA,
              15 U.S.C. &sect; 8403), the California Automatic Renewal Law as amended by AB 2863 effective July 1, 2025
              (Cal. Bus. &amp; Prof. Code &sect;&sect; 17600&ndash;17606), and substantially similar laws in New York,
              Oregon, Connecticut, Vermont, North Carolina, Illinois, Virginia, Colorado, and Tennessee.
            </p>
            <ul className="list-disc list-inside space-y-2 text-white/60 mb-3">
              <li>
                <strong className="text-white/80">Auto-renewal.</strong> Paid subscriptions (Plus and Forge, monthly and yearly) automatically renew at the end of each billing period and continue to renew indefinitely until you cancel. Each renewal charge uses the payment method on file.
              </li>
              <li>
                <strong className="text-white/80">Length and pricing.</strong> The initial term, renewal term, and price you agreed to are shown on the Pricing page, restated on the Stripe-hosted checkout, and re-confirmed in the post-purchase acknowledgment email (see below). Prices may change only with advance notice as described in the &quot;Material changes&quot; item.
              </li>
              <li>
                <strong className="text-white/80">Affirmative consent at checkout.</strong> Before you are charged, you must click a checkbox or equivalent affirmative control acknowledging that your subscription will automatically renew and that you authorize the recurring charge. This is required to be <em>separate</em> from your general acceptance of these Terms; it is presented as a distinct control in the signup flow and at the Stripe checkout step.
              </li>
              <li>
                <strong className="text-white/80">Post-purchase acknowledgment.</strong> Immediately after each initial purchase, tier change, or renewal, we send an email to your registered address containing, in a form that can be retained and reproduced: a summary of the agreement, the renewal terms (cadence and amount), a description of how to cancel, and a link to the Parent Dashboard cancellation control.
              </li>
              <li>
                <strong className="text-white/80">Annual reminder for yearly plans.</strong> For Plus Yearly and Forge Yearly subscriptions, we send a renewal-reminder email between three (3) and twenty-one (21) days before each annual renewal, restating the subscription, the amount that will be charged, and the cancellation control.
              </li>
              <li>
                <strong className="text-white/80">Material changes.</strong> If we materially change the auto-renewal terms (for example, a price increase, a change in billing cadence, or a change in the feature set of the tier you purchased), we will provide notice by email not less than seven (7) days and not more than thirty (30) days before the change takes effect, together with a clear opportunity to cancel before the change applies to you.
              </li>
              <li>
                <strong className="text-white/80">Click-to-quit cancellation.</strong> You may cancel at any time through a one-click online cancellation control in the Parent Dashboard&apos;s Subscription page; no phone call, chat, email, or retention flow is required. If you signed up by phone or another non-online method, you may cancel by the same medium. Cancellation takes effect at the end of the current billing period and will be confirmed by email.
              </li>
              <li>
                <strong className="text-white/80">Record of consent.</strong> We retain server-side proof of each affirmative auto-renewal consent &mdash; the timestamp and the version of these Terms in effect at the time &mdash; for the life of the account. Additional evidence (including the IP address, user-agent, and payment-authorization metadata associated with each consent action) is retained on our behalf by Stripe for at least seven (7) years, consistent with Cal. Bus. &amp; Prof. Code &sect; 17602.1(d).
              </li>
            </ul>

            <h3 className="font-display text-lg font-medium text-white/90 mt-6 mb-2">
              4f. Free Trial Terms (Free-to-Pay Conversions)
            </h3>
            <p className="text-white/60 mb-3">
              Plus and Forge tiers may be offered with a seven (7) day free trial on first subscription only. Free trials
              are subject to the following additional disclosures required by CA ARL AB 2863 for &quot;free-to-pay
              conversions&quot;:
            </p>
            <ul className="list-disc list-inside space-y-2 text-white/60">
              <li>
                <strong className="text-white/80">Before the trial begins.</strong> Before we collect your payment method, we clearly and conspicuously disclose (on the Pricing page and again at the Stripe checkout step): the length of the trial, that the trial will convert to a paid subscription at the end, the amount that will be charged at conversion, the billing cadence thereafter, and how to cancel before conversion.
              </li>
              <li>
                <strong className="text-white/80">Mid-trial reminder.</strong> We send a reminder email forty-eight (48) hours before the trial ends, restating the same disclosures and the cancellation control.
              </li>
              <li>
                <strong className="text-white/80">Conversion authorization.</strong> Your initial affirmative checkbox covers both the trial and the automatic conversion to a paid subscription. Your payment method is charged on the day the trial ends unless you have canceled.
              </li>
              <li>
                <strong className="text-white/80">One-trial rule.</strong> A free trial is available to each parent account only once; returning subscribers do not receive a second free trial, and we do not condition continued use on repeat trials.
              </li>
            </ul>

            <h3 className="font-display text-lg font-medium text-white/90 mt-6 mb-2">
              4g. Merchant-Initiated Transactions &amp; Continuous Authority
            </h3>
            <p className="text-white/60 mb-3">
              The following provisions apply to the recurring charges authorized in &sect;&sect; 4e and 4f and are required
              to comply with the Visa Merchant Rules, Mastercard Recurring Billing Framework, and (for European cards) the
              Strong Customer Authentication requirements of Directive (EU) 2015/2366 (PSD2) and the EBA Regulatory
              Technical Standards on SCA.
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-white/60">
              <li>
                <strong className="text-white/80">Continuous authority.</strong> By providing a payment method and completing the affirmative checkbox at checkout, you grant SparkForge LLC (and our payment processor Stripe) continuous authority to initiate recurring merchant-initiated transactions (MITs) against that payment method on each billing date for as long as your subscription remains active.
              </li>
              <li>
                <strong className="text-white/80">SCA/PSD2 mandate.</strong> Your affirmative checkbox also constitutes the SCA mandate required under PSD2 for subsequent merchant-initiated transactions; initial strong customer authentication is performed through Stripe at the first charge.
              </li>
              <li>
                <strong className="text-white/80">Payment retries.</strong> If a scheduled charge fails (for example, due to insufficient funds or an expired card), you authorize SparkForge to retry the charge up to four (4) times over the following seven (7) days using Stripe&apos;s Smart Retries feature. If all retries fail, your subscription enters the dunning sequence described in our Privacy Policy (Section 7 retention) and in communications sent to your registered email.
              </li>
              <li>
                <strong className="text-white/80">Account Updater.</strong> You authorize SparkForge and Stripe to receive updated card details from the Visa Account Updater, Mastercard Automatic Billing Updater, and equivalent services when your card-issuing bank provides a replacement or updated card number, so that your subscription can continue without interruption.
              </li>
              <li>
                <strong className="text-white/80">Revocation.</strong> You may revoke continuous authority at any time by canceling your subscription through the Parent Dashboard (&sect; 4e click-to-quit) or by removing the payment method through the Stripe Customer Portal linked from that page. Revocation is effective for all charges not yet authorized by Stripe.
              </li>
            </ul>
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
              <li>
                <strong className="text-white/80">Ownership of prompts and output.</strong> You retain ownership of the
                prompts you submit to the Prompt Lab. SparkForge LLC processes those prompts via the Anthropic Claude API
                under Anthropic&apos;s commercial terms, which assign ownership of the model&apos;s output to the API
                customer (here, SparkForge LLC). SparkForge, in turn, grants you a perpetual, worldwide, royalty-free,
                non-exclusive license to use the output generated from your own prompts for personal educational purposes.
                We do not claim any ownership interest in the output generated from your prompts.
              </li>
              <li>
                <strong className="text-white/80">No model training on your content.</strong> Under Anthropic&apos;s
                commercial API terms, Anthropic does not use SparkForge API traffic &mdash; including user-submitted
                prompts and AI-generated responses &mdash; to train its foundation models. SparkForge likewise does not
                use your prompts or AI output to train any third-party model.
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
              <li>
                <strong className="text-white/80">Copyright infringement claims.</strong> If you believe content available through SparkForge infringes a copyright you own or control, please follow the notice procedure in our{' '}
                <Link href="/dmca" className="text-spark-blue hover:underline">DMCA Policy</Link>, which includes our Designated Copyright Agent&apos;s contact details and the statutory elements required by 17 U.S.C. &sect; 512(c)(3).
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

            <div className="p-3 rounded-lg bg-spark-amber/5 border border-spark-amber/20 mb-4">
              <p className="text-sm text-white/80">
                <strong className="text-white">PLEASE READ THIS SECTION CAREFULLY.</strong> It affects your legal rights,
                including your right to file a lawsuit in court. This section is governed by the Federal Arbitration Act,
                9 U.S.C. &sect;&sect; 1&ndash;16. You have a right to opt out of the arbitration agreement within 30 days of
                first accepting these Terms &mdash; see &sect; 12d.
              </p>
            </div>

            <h3 className="font-display text-lg font-medium text-white/90 mb-2">12a. Governing Law</h3>
            <p className="text-white/60 mb-3">
              These Terms are governed by and construed in accordance with the laws of the State of Illinois, United
              States, without regard to conflict-of-law provisions. SparkForge LLC is organized as an Illinois limited
              liability company. This choice of law does not deprive you of the protection of any provision of the
              consumer-protection law of the state in which you reside that cannot be derogated from by agreement.
            </p>

            <h3 className="font-display text-lg font-medium text-white/90 mb-2 mt-5">12b. Informal Resolution First</h3>
            <p className="text-white/60 mb-3">
              Before initiating arbitration or a small-claims action, you agree to contact us at{' '}
              <a href="mailto:legal@sparkforge-labs.com" className="text-spark-blue hover:underline">legal@sparkforge-labs.com</a>{' '}
              with a written description of the dispute, your contact information, and the relief sought. We will attempt
              in good faith to resolve the dispute within sixty (60) days of receipt. Either party may initiate formal
              proceedings only after this sixty-day window has passed without resolution.
            </p>

            <h3 className="font-display text-lg font-medium text-white/90 mb-2 mt-5">12c. Binding Individual Arbitration</h3>
            <p className="text-white/60 mb-3">
              Except as provided in &sect;&sect; 12e (small-claims carve-out) and 12g (McGill exception), any dispute,
              claim, or controversy arising out of or relating to these Terms or your use of SparkForge &mdash; including
              the interpretation, formation, performance, breach, or termination of these Terms &mdash; shall be resolved
              through binding individual arbitration administered by JAMS under its Consumer Minimum Standards and
              Streamlined Arbitration Rules. The arbitration shall be conducted remotely (online or by phone) unless both
              parties agree otherwise in writing. Judgment on the award may be entered in any court of competent
              jurisdiction.
            </p>

            <h3 className="font-display text-lg font-medium text-white/90 mb-2 mt-5">12d. 30-Day Opt-Out</h3>
            <p className="text-white/60 mb-3">
              You may opt out of the arbitration agreement in &sect; 12c (and the class-action waiver in &sect; 12f) by
              emailing{' '}
              <a href="mailto:legal@sparkforge-labs.com" className="text-spark-blue hover:underline">legal@sparkforge-labs.com</a>{' '}
              within thirty (30) days of your first acceptance of these Terms, with the subject line <em>&quot;Arbitration
              Opt-Out,&quot;</em> your name, the email address associated with your SparkForge account, and a clear
              statement that you wish to opt out. Opting out does not affect any other provision of these Terms, and we
              will not retaliate against you for opting out.
            </p>

            <h3 className="font-display text-lg font-medium text-white/90 mb-2 mt-5">12e. Small-Claims Carve-Out</h3>
            <p className="text-white/60 mb-3">
              Either party may bring an individual action in small-claims court (or the equivalent in your state) for any
              dispute that qualifies under that court&apos;s monetary jurisdictional limit, provided the action remains in
              small-claims court and is not removed or appealed into a court of general jurisdiction.
            </p>

            <h3 className="font-display text-lg font-medium text-white/90 mb-2 mt-5">12f. Class-Action Waiver</h3>
            <p className="text-white/60 mb-3">
              You and SparkForge LLC agree that each party may bring claims against the other only in an individual
              capacity, not as a plaintiff or class member in any purported class, collective, representative, or private
              attorney general proceeding. No arbitrator has the authority to preside over any form of class, collective,
              or representative arbitration. If a court of competent jurisdiction finds this class-action waiver
              unenforceable as to any specific claim, that specific claim shall be severed from arbitration and litigated
              in court; the remaining claims shall proceed in arbitration.
            </p>

            <h3 className="font-display text-lg font-medium text-white/90 mb-2 mt-5">12g. California Public Injunctive Relief (McGill)</h3>
            <p className="text-white/60 mb-3">
              Pursuant to <em>McGill v. Citibank, N.A.</em>, 2 Cal. 5th 945 (2017), if you are a California resident, any
              claim for public injunctive relief under the California Unfair Competition Law, False Advertising Law, or
              Consumers Legal Remedies Act that is determined by a court of competent jurisdiction to be non-arbitrable
              shall be severed from any arbitration proceeding and heard in a California court; all remaining claims shall
              proceed in arbitration. This severance does not invalidate the remainder of this &sect; 12.
            </p>

            <h3 className="font-display text-lg font-medium text-white/90 mb-2 mt-5">12h. Mass Arbitration Protocol</h3>
            <p className="text-white/60 mb-3">
              If twenty-five (25) or more arbitration demands of a substantially similar nature are filed against
              SparkForge LLC within a sixty-day (60) period by or on behalf of claimants represented by the same or
              coordinated counsel, the following procedure applies in lieu of simultaneously processing all demands:
              (i) the parties shall work with JAMS to adopt its Mass Arbitration Procedures (or an equivalent batched
              protocol); (ii) an initial pool of ten (10) bellwether cases shall be selected (five by each side) and
              arbitrated to final award; (iii) the parties shall then engage in good-faith mediation on the remaining
              demands for sixty (60) days; (iv) any demand not resolved through mediation shall proceed in sequential
              batches of ten. This &sect; 12h does not limit any party&apos;s substantive rights; it allocates procedure
              so that fee obligations and adjudication can proceed on a manageable schedule.
            </p>

            <h3 className="font-display text-lg font-medium text-white/90 mb-2 mt-5">12i. Carve-Outs for Non-Waivable Rights</h3>
            <p className="text-white/60 mb-3">
              Nothing in this &sect; 12 (or in &sect; 11 Limitation of Liability) waives or limits a right that applicable
              law does not permit to be waived or limited, including &mdash; without limitation &mdash; rights under
              California Civil Code &sect; 1668 (no pre-dispute waiver of liability for fraud, willful injury, or
              violation of law), the Illinois Consumer Fraud and Deceptive Business Practices Act (815 ILCS 505), the
              Magnuson-Moss Warranty Act, or the implied warranties of merchantability and fitness for a particular
              purpose to the extent they cannot be waived in a consumer transaction under the law of your state.
            </p>

            <h3 className="font-display text-lg font-medium text-white/90 mb-2 mt-5">12j. Regulatory Complaints Preserved</h3>
            <p className="text-sm text-white/70">
              Nothing in this section limits your right to file a complaint with the Federal Trade Commission (the COPPA
              enforcement authority), your state&apos;s Attorney General, an EU/EEA supervisory authority, the UK
              Information Commissioner&apos;s Office, or any other governmental body with jurisdiction over SparkForge.
              Participation in arbitration does not preclude you from cooperating with a governmental investigation.
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

          {/* ═══ Section 15: Miscellaneous ═══ */}
          <section id="miscellaneous">
            <h2 className="font-display text-xl font-semibold text-white mb-3">
              15. Miscellaneous
            </h2>

            <h3 className="font-display text-lg font-medium text-white/90 mb-2">15a. Severability</h3>
            <p className="text-white/60 mb-3">
              If any provision of these Terms is held invalid or unenforceable by a court of competent jurisdiction, that
              provision shall be enforced to the maximum extent permissible and the remaining provisions shall remain in
              full force and effect. A finding that a particular provision is invalid or unenforceable shall not affect the
              validity or enforceability of any other provision.
            </p>

            <h3 className="font-display text-lg font-medium text-white/90 mb-2 mt-5">15b. Entire Agreement</h3>
            <p className="text-white/60 mb-3">
              These Terms, together with our{' '}
              <Link href="/privacy" className="text-spark-blue hover:underline">Privacy Policy</Link>,{' '}
              <Link href="/privacy/children" className="text-spark-blue hover:underline">Children&apos;s Privacy Notice</Link>,{' '}
              <Link href="/cookies" className="text-spark-blue hover:underline">Cookie Policy</Link>, and{' '}
              <Link href="/dmca" className="text-spark-blue hover:underline">DMCA Policy</Link>, constitute the entire
              agreement between you and SparkForge LLC regarding your use of the Platform and supersede all prior or
              contemporaneous communications, proposals, and representations, whether oral or written.
            </p>

            <h3 className="font-display text-lg font-medium text-white/90 mb-2 mt-5">15c. Assignment</h3>
            <p className="text-white/60 mb-3">
              You may not assign or transfer these Terms, by operation of law or otherwise, without our prior written
              consent; any attempted assignment without consent is void. SparkForge LLC may assign these Terms, in whole
              or in part, to any affiliate or to any successor in interest by merger, acquisition, reorganization, or sale
              of substantially all of its assets, upon notice to you at the email address on your account.
            </p>

            <h3 className="font-display text-lg font-medium text-white/90 mb-2 mt-5">15d. Force Majeure</h3>
            <p className="text-white/60 mb-3">
              Neither party will be liable for any failure or delay in performance due to causes beyond its reasonable
              control, including acts of God, natural disasters, epidemics or pandemics, war, terrorism, civil unrest,
              labor disputes, fire, flood, power or telecommunications failure, the acts or omissions of upstream service
              providers (including Supabase, Stripe, Anthropic, Vercel, Resend, and Sentry), cyberattack, or governmental
              action. The affected party shall use commercially reasonable efforts to resume performance as soon as
              practicable. Obligations to pay amounts already due are not excused.
            </p>

            <h3 className="font-display text-lg font-medium text-white/90 mb-2 mt-5">15e. Export Controls &amp; Sanctions</h3>
            <p className="text-white/60 mb-3">
              You represent and warrant that you are not located in, and will not access the Platform from, any country
              subject to comprehensive U.S. economic sanctions (currently Cuba, Iran, North Korea, Syria, and the
              Russia-occupied regions of Ukraine (including Crimea, Donetsk, Luhansk, Kherson, and Zaporizhzhia)), and
              that you are not listed on the U.S. Department of the Treasury Office of Foreign Assets Control
              (OFAC) Specially Designated Nationals and Blocked Persons List, the U.S. Department of Commerce Denied
              Persons List, or any equivalent list maintained by the U.S., EU, or UK. You will comply with all applicable
              U.S. and foreign export-control and sanctions laws in your use of the Platform.
            </p>

            <h3 className="font-display text-lg font-medium text-white/90 mb-2 mt-5">15f. App Store Purchases</h3>
            <p className="text-white/60 mb-3">
              SparkForge is currently offered as a web application. If in the future SparkForge is distributed through the
              Apple App Store or the Google Play Store and you purchase a subscription through one of those channels: (i)
              the subscription is additionally governed by the Apple Media Services Terms and Conditions or the Google
              Play Terms of Service, as applicable; (ii) store-channel cancellation and refund rules supplement (and in
              some cases supersede) the corresponding provisions of these Terms; (iii) the relevant app store is an
              intended third-party beneficiary of these Terms and may enforce them. Where store-channel rules require
              additional or different disclosures, those additional disclosures are incorporated here by reference.
            </p>

            <h3 className="font-display text-lg font-medium text-white/90 mb-2 mt-5">15g. Notices</h3>
            <p className="text-white/60 mb-3">
              We may give notice to you by email to the address on your account, by an in-app banner, or by posting to
              the Platform. Notices to SparkForge LLC must be in writing and sent to{' '}
              <a href="mailto:legal@sparkforge-labs.com" className="text-spark-blue hover:underline">legal@sparkforge-labs.com</a>{' '}
              or to the mailing address in &sect; 14. A notice is effective when received (for email, on the date sent
              unless bounced).
            </p>

            <h3 className="font-display text-lg font-medium text-white/90 mb-2 mt-5">15h. No Waiver; Headings</h3>
            <p className="text-white/60">
              Our failure to enforce any right or provision of these Terms shall not constitute a waiver of that right or
              provision. Section headings are provided for convenience only and do not affect interpretation.
            </p>
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
