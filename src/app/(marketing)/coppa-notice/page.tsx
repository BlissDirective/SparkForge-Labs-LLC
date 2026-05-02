import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'COPPA Notice — SparkForge',
  description:
    'SparkForge COPPA notice for parents and guardians. Plain-language summary of what we collect from children, how we use it, and your rights under 16 CFR Part 312.',
};

// ════════════════════════════════════════════════════
// COPPA DIRECT NOTICE — 16 CFR § 312.4(c)
// Required: prominent, plain-language disclosure to parents
// before any collection of personal information from children.
// Companion to /privacy (full policy). Linked from signup,
// consent flow, footer, and privacy page intro.
// LEGAL REVIEW REQUIRED before production launch.
// ════════════════════════════════════════════════════

export default function CoppaNoticePage() {
  return (
    <div className="pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-6">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-block px-3 py-1 rounded-full bg-spark-blue/10 border border-spark-blue/20 text-spark-blue text-xs font-data uppercase tracking-wider mb-4">
            For Parents &amp; Guardians
          </div>
          <h1 className="font-display text-4xl font-bold mb-3 bg-gradient-to-r from-spark-blue to-spark-purple bg-clip-text text-transparent">
            COPPA Notice
          </h1>
          <p className="text-white/70 font-body">
            Effective Date: April 25, 2026 &middot; Last Updated: April 25, 2026
          </p>
        </div>

        <div className="space-y-10 font-body text-white/70 leading-relaxed">
          {/* Plain-language summary */}
          <section
            aria-labelledby="summary"
            className="p-5 rounded-lg bg-spark-blue/[0.04] border border-spark-blue/[0.15]"
          >
            <h2
              id="summary"
              className="font-display text-lg font-semibold text-white mb-2"
            >
              In Plain Language
            </h2>
            <p className="text-white/80">
              SparkForge is a learning platform for children ages 7&ndash;16. The U.S.
              Children&apos;s Online Privacy Protection Act (COPPA) requires us to give
              parents and guardians a clear notice before we collect any personal
              information from a child under 13. This page is that notice. The full
              legal detail is in our{' '}
              <Link
                href="/privacy"
                className="text-spark-blue hover:underline"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          {/* 1. Operator */}
          <section id="operator">
            <h2 className="font-display text-xl font-semibold text-white mb-3">
              1. Who Operates SparkForge
            </h2>
            <p>
              SparkForge is operated by{' '}
              <strong className="text-white/90">BlissDirective</strong>. We are
              the operator responsible for handling your child&apos;s information
              under COPPA.
            </p>
            <div className="mt-4 p-4 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <p className="text-sm text-white/60">
                <strong className="text-white/80">BlissDirective</strong>
                <br />
                Privacy contact:{' '}
                <a
                  href="mailto:privacy@sparkforge-labs.com"
                  className="text-spark-blue hover:underline"
                >
                  privacy@sparkforge-labs.com
                </a>
                <br />
                Use this address for all COPPA inquiries, parental rights requests,
                and consent withdrawal.
              </p>
            </div>
          </section>

          {/* 2. What we collect */}
          <section id="what-we-collect">
            <h2 className="font-display text-xl font-semibold text-white mb-3">
              2. What We Collect From Your Child
            </h2>
            <p className="mb-4">
              We collect only the minimum information needed for the learning
              experience. A child cannot be required to disclose more than is
              reasonably necessary to participate.
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-white/60">
              <li>
                A child display name or nickname you choose during profile setup
                (no last names required)
              </li>
              <li>
                Age band (7&ndash;9, 10&ndash;12, 13&ndash;16) used to tailor difficulty &mdash; we
                do not require a precise birthdate
              </li>
              <li>Game progress, scores, badges, and XP</li>
              <li>
                Learning session metadata (lesson started, time spent, completion)
              </li>
              <li>
                Prompt Lab inputs (only for ages 13&ndash;16; outputs are filtered for
                safety and stored for parent review)
              </li>
              <li>
                Technical data needed to operate the service (anonymized error
                reports with PII automatically scrubbed by our monitoring tools)
              </li>
            </ul>
            <p className="mt-4">
              We do <strong className="text-white/90">not</strong> collect: full
              name, home address, phone number, precise location, biometrics,
              persistent identifiers used for behavioral advertising, photos or
              audio recordings, or contact information for the child&apos;s friends.
            </p>
          </section>

          {/* 3. How we use it */}
          <section id="how-we-use">
            <h2 className="font-display text-xl font-semibold text-white mb-3">
              3. How We Use Your Child&apos;s Information
            </h2>
            <ul className="list-disc list-inside space-y-1.5 text-white/60">
              <li>To deliver lessons, games, and the Prompt Lab</li>
              <li>To save progress and unlock badges</li>
              <li>To show you, the parent, your child&apos;s activity</li>
              <li>To keep the service safe (abuse detection, content moderation)</li>
              <li>To meet legal obligations and respond to your requests</li>
            </ul>
            <p className="mt-4">
              We do <strong className="text-white/90">not</strong> sell your
              child&apos;s data, use it for behavioral advertising, allow third-party
              ad networks, or share it with anyone except the limited service
              providers listed in our{' '}
              <Link
                href="/privacy#third-parties"
                className="text-spark-blue hover:underline"
              >
                Privacy Policy
              </Link>
              {' '}(payment processing, hosting, error monitoring, AI inference for
              the Prompt Lab).
            </p>
          </section>

          {/* 4. Verifiable parental consent */}
          <section id="vpc">
            <h2 className="font-display text-xl font-semibold text-white mb-3">
              4. Verifiable Parental Consent
            </h2>
            <p className="mb-4">
              Before any personal information is collected from a child under 13,
              we obtain verifiable parental consent. Our consent process:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-white/60">
              <li>
                The parent or guardian creates a SparkForge account using their
                own email address.
              </li>
              <li>
                The parent confirms ownership of that email by clicking a unique
                verification link we send to it.
              </li>
              <li>
                The parent reviews this notice and the full Privacy Policy, then
                affirmatively consents on the in-app consent screen.
              </li>
              <li>
                Only after consent is recorded does the parent create a child
                profile.
              </li>
            </ol>
            <p className="mt-4">
              For children ages 13&ndash;16, parental consent is not required by
              COPPA, but we still recommend parental oversight and provide the
              same parental controls.
            </p>
          </section>

          {/* 5. Parental rights */}
          <section id="parental-rights">
            <h2 className="font-display text-xl font-semibold text-white mb-3">
              5. Your Rights as a Parent
            </h2>
            <p className="mb-4">
              At any time, and at no charge, you may:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-white/60">
              <li>
                <strong className="text-white/80">Review</strong> the personal
                information we have collected from your child, from the parent
                dashboard or by emailing us.
              </li>
              <li>
                <strong className="text-white/80">Refuse further collection</strong>
                {' '}by withdrawing consent. We will stop collecting new data and
                disable the child profile.
              </li>
              <li>
                <strong className="text-white/80">Request deletion</strong> of
                your child&apos;s information. Deletion is processed within 30
                days; we may retain a minimal anonymized record only where
                required by law.
              </li>
              <li>
                <strong className="text-white/80">Limit disclosure</strong> by
                opting out of any optional features that involve a third-party
                processor.
              </li>
            </ul>
            <p className="mt-4">
              To exercise any of these rights, email{' '}
              <a
                href="mailto:privacy@sparkforge-labs.com"
                className="text-spark-blue hover:underline"
              >
                privacy@sparkforge-labs.com
              </a>{' '}
              from the parent email on file. We respond within 10 business days.
            </p>
          </section>

          {/* 6. Children's rights */}
          <section id="childrens-rights">
            <h2 className="font-display text-xl font-semibold text-white mb-3">
              6. Children&apos;s Rights
            </h2>
            <p>
              Children using SparkForge can ask their parent or guardian at any
              time to review, correct, or delete their information. Children may
              also contact us through their parent at{' '}
              <a
                href="mailto:privacy@sparkforge-labs.com"
                className="text-spark-blue hover:underline"
              >
                privacy@sparkforge-labs.com
              </a>
              . We will work with the parent to honor the request.
            </p>
          </section>

          {/* 7. Changes */}
          <section id="changes">
            <h2 className="font-display text-xl font-semibold text-white mb-3">
              7. Changes to This Notice
            </h2>
            <p>
              If we make a material change to what we collect from children, how
              we use it, or our consent practices, we will notify the parent
              email on file and obtain new consent before the change takes
              effect.
            </p>
          </section>

          {/* 8. Contact */}
          <section id="contact">
            <h2 className="font-display text-xl font-semibold text-white mb-3">
              8. Contact Us
            </h2>
            <p>
              For COPPA-related questions, parental rights requests, or to
              withdraw consent:
            </p>
            <div className="mt-4 p-4 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <p className="text-sm text-white/60">
                <strong className="text-white/80">BlissDirective &mdash; SparkForge Privacy</strong>
                <br />
                <a
                  href="mailto:privacy@sparkforge-labs.com"
                  className="text-spark-blue hover:underline"
                >
                  privacy@sparkforge-labs.com
                </a>
              </p>
            </div>
            <p className="mt-6 text-sm text-white/50">
              You may also contact the U.S. Federal Trade Commission at{' '}
              <a
                href="https://www.ftc.gov/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-spark-blue hover:underline"
              >
                ftc.gov
              </a>
              {' '}or 1-877-FTC-HELP.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
