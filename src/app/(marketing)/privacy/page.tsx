import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — SparkForge',
  description: 'SparkForge privacy policy. Learn how we protect your data and comply with COPPA.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-surface-deep text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <Link href="/" className="inline-flex items-center gap-2 mb-12 text-white/50 hover:text-white transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to SparkForge
        </Link>

        <h1 className="font-display text-4xl font-bold mb-2 bg-gradient-to-r from-spark-blue to-spark-purple bg-clip-text text-transparent">
          Privacy Policy
        </h1>
        <p className="text-white/40 font-body mb-12">Last updated: March 30, 2026</p>

        <div className="space-y-10 font-body text-white/70 leading-relaxed">
          <section>
            <h2 className="font-display text-xl font-semibold text-white mb-3">1. Introduction</h2>
            <p>
              SparkForge (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is a gamified AI learning platform designed for children ages 7&ndash;16.
              We are committed to protecting the privacy of all users, especially children. This Privacy Policy explains
              how we collect, use, disclose, and safeguard information when you use SparkForge.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-white mb-3">2. COPPA Compliance</h2>
            <p>
              SparkForge complies with the Children&apos;s Online Privacy Protection Act (COPPA). We do not collect personal
              information from children under 13 without verifiable parental consent. Key protections include:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2 text-white/60">
              <li>Only parents/guardians can create accounts and child profiles</li>
              <li>Parents must confirm they are 18+ and consent to their child&apos;s use</li>
              <li>Child profiles use display names only &mdash; no email, phone, or real names required</li>
              <li>Parents can review, modify, or delete their child&apos;s data at any time</li>
              <li>AI-generated content is screened through multi-layer moderation</li>
              <li>Prompt history is automatically cleaned up on a daily schedule</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-white mb-3">3. Information We Collect</h2>
            <h3 className="font-display text-lg font-medium text-white/90 mb-2">Parent Account Information</h3>
            <p>Email address, hashed password, subscription status, and COPPA consent timestamp.</p>
            <h3 className="font-display text-lg font-medium text-white/90 mt-4 mb-2">Child Profile Information</h3>
            <p>Display name, age band (A: 7&ndash;9, B: 10&ndash;12, C: 13&ndash;16), avatar selection, XP, badges, and game progress.</p>
            <h3 className="font-display text-lg font-medium text-white/90 mt-4 mb-2">Usage Data</h3>
            <p>Game progress, session duration, and learning analytics &mdash; used solely to personalize the learning experience.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-white mb-3">4. How We Use Information</h2>
            <ul className="list-disc list-inside space-y-2 text-white/60">
              <li>Provide and personalize the learning experience</li>
              <li>Track game progress, XP, and achievements</li>
              <li>Generate age-appropriate AI content (with moderation)</li>
              <li>Process subscription payments via Stripe</li>
              <li>Send account-related communications to parents</li>
              <li>Monitor and improve platform performance</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-white mb-3">5. Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul className="list-disc list-inside mt-3 space-y-2 text-white/60">
              <li><strong className="text-white/80">Supabase</strong> &mdash; Authentication and database hosting</li>
              <li><strong className="text-white/80">Stripe</strong> &mdash; Payment processing (parent accounts only)</li>
              <li><strong className="text-white/80">Anthropic Claude API</strong> &mdash; AI content generation (moderated, no child PII sent)</li>
              <li><strong className="text-white/80">Sentry</strong> &mdash; Error monitoring (configured to strip child-related data)</li>
              <li><strong className="text-white/80">Vercel</strong> &mdash; Application hosting</li>
            </ul>
            <p className="mt-3">No child personal information is shared with advertisers or data brokers.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-white mb-3">6. Data Retention &amp; Deletion</h2>
            <p>
              Parents can delete child profiles at any time through the Parent Dashboard. When a child profile is deleted,
              all associated data (progress, sessions, prompt history) is permanently removed. Prompt history is
              automatically purged on a daily schedule regardless of deletion requests.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-white mb-3">7. Data Security</h2>
            <p>
              We implement industry-standard security measures including encrypted connections (TLS),
              Row Level Security (RLS) policies on all database tables, rate limiting on API endpoints,
              and secure session management via Supabase Auth.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-white mb-3">8. Parental Rights</h2>
            <p>Parents/guardians have the right to:</p>
            <ul className="list-disc list-inside mt-3 space-y-2 text-white/60">
              <li>Review their child&apos;s personal information</li>
              <li>Request deletion of their child&apos;s data</li>
              <li>Refuse further collection of their child&apos;s information</li>
              <li>Manage content filters and time limits via the Parent Dashboard</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-white mb-3">9. Contact Us</h2>
            <p>
              For privacy-related inquiries or to exercise parental rights, contact us at{' '}
              <a href="mailto:privacy@sparkforge.app" className="text-spark-blue hover:underline">privacy@sparkforge.app</a>.
            </p>
          </section>
        </div>

        {/* Footer nav */}
        <div className="mt-16 pt-8 border-t border-white/[0.06] flex gap-6 text-sm text-white/40">
          <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
        </div>
      </div>
    </div>
  );
}
