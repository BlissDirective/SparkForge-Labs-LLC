import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service — SparkForge',
  description: 'SparkForge terms of service. Rules and guidelines for using the platform.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-surface-deep text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <Link href="/" className="inline-flex items-center gap-2 mb-12 text-white/50 hover:text-white transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to SparkForge
        </Link>

        <h1 className="font-display text-4xl font-bold mb-2 bg-gradient-to-r from-spark-blue to-spark-purple bg-clip-text text-transparent">
          Terms of Service
        </h1>
        <p className="text-white/40 font-body mb-12">Last updated: March 30, 2026</p>

        <div className="space-y-10 font-body text-white/70 leading-relaxed">
          <section>
            <h2 className="font-display text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using SparkForge (&quot;the Platform&quot;), you agree to be bound by these Terms of Service.
              If you are a parent or guardian creating an account for a child, you accept these terms on behalf of yourself
              and your child. If you do not agree, do not use the Platform.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-white mb-3">2. Account Registration</h2>
            <ul className="list-disc list-inside space-y-2 text-white/60">
              <li>You must be at least 18 years old to create a parent account</li>
              <li>You are responsible for maintaining the security of your account credentials</li>
              <li>Child profiles can only be created by a registered parent/guardian</li>
              <li>You must provide accurate information during registration</li>
              <li>Each parent account may create multiple child profiles</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-white mb-3">3. Demo Accounts</h2>
            <p>
              SparkForge offers a demo mode that allows exploration without account creation. Demo sessions are limited
              to 1 hour, after which all session data is discarded. Demo users have access to the full platform
              experience but progress is not saved.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-white mb-3">4. Subscriptions &amp; Payments</h2>
            <p>SparkForge offers three tiers:</p>
            <ul className="list-disc list-inside mt-3 space-y-2 text-white/60">
              <li><strong className="text-white/80">Free</strong> &mdash; Limited access to select games and labs</li>
              <li><strong className="text-white/80">Plus</strong> &mdash; Full access to all 35 games and 10 labs</li>
              <li><strong className="text-white/80">Forge</strong> &mdash; Plus features + AI-powered content generation</li>
            </ul>
            <p className="mt-3">
              Paid subscriptions are processed through Stripe. You may cancel at any time through the Parent Dashboard.
              Refunds are handled per Stripe&apos;s standard refund policies.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-white mb-3">5. Acceptable Use</h2>
            <p>You and your child agree not to:</p>
            <ul className="list-disc list-inside mt-3 space-y-2 text-white/60">
              <li>Attempt to bypass authentication, security measures, or rate limits</li>
              <li>Use the platform for any purpose other than educational learning</li>
              <li>Submit harmful, abusive, or inappropriate content through AI prompts</li>
              <li>Reverse-engineer, decompile, or extract source code from the platform</li>
              <li>Share account credentials with unauthorized users</li>
              <li>Use automated tools, bots, or scrapers to access the platform</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-white mb-3">6. AI-Generated Content</h2>
            <p>
              SparkForge uses AI (Anthropic Claude) to generate educational content. All AI output passes through
              multi-layer content moderation (pattern matching + LLM screening). While we strive for accuracy and
              appropriateness, AI-generated content may occasionally contain errors. SparkForge is an educational
              supplement, not a replacement for formal education.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-white mb-3">7. Intellectual Property</h2>
            <p>
              All content, design, code, graphics, and game mechanics on SparkForge are owned by BlissDirective.
              You may not reproduce, distribute, or create derivative works without written permission.
              Child-created content within the platform (e.g., prompt responses) remains the property of the user.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-white mb-3">8. Limitation of Liability</h2>
            <p>
              SparkForge is provided &quot;as is&quot; without warranties of any kind. BlissDirective shall not be liable for
              any indirect, incidental, or consequential damages arising from platform use. Our total liability
              shall not exceed the amount paid by you in the 12 months preceding any claim.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-white mb-3">9. Termination</h2>
            <p>
              We reserve the right to suspend or terminate accounts that violate these terms. You may delete your
              account at any time. Upon termination, all associated data will be permanently deleted in accordance
              with our <Link href="/privacy" className="text-spark-blue hover:underline">Privacy Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-white mb-3">10. Changes to Terms</h2>
            <p>
              We may update these Terms of Service from time to time. Material changes will be communicated via
              email to registered parent accounts. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-white mb-3">11. Contact</h2>
            <p>
              For questions about these terms, contact us at{' '}
              <a href="mailto:legal@sparkforge.app" className="text-spark-blue hover:underline">legal@sparkforge.app</a>.
            </p>
          </section>
        </div>

        {/* Footer nav */}
        <div className="mt-16 pt-8 border-t border-white/[0.06] flex gap-6 text-sm text-white/40">
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
        </div>
      </div>
    </div>
  );
}
