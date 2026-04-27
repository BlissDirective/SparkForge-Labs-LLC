import { Metadata } from 'next';
import Link from 'next/link';
import { FileSearch, Trash2, ShieldOff, KeyRound, SlidersHorizontal, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Parental Rights — SparkForge',
  description:
    'Exercise your rights under the Children\'s Online Privacy Protection Act (COPPA). Review, delete, refuse further collection, or revoke consent for your child\'s data on SparkForge.',
};

// ════════════════════════════════════════════════════
// PARENTAL RIGHTS PAGE — COPPA 16 CFR 312.6
// Companion to /privacy; provides an actionable interface for parents
// to exercise the five statutory rights plus content-control settings.
// LEGAL REVIEW REQUIRED before production launch.
// ════════════════════════════════════════════════════

const RIGHTS = [
  {
    id: 'review',
    icon: FileSearch,
    accent: 'blue',
    title: 'Right to review',
    statute: '16 CFR 312.6(a)(1)',
    summary:
      "You may review all personal information SparkForge has collected from your child.",
    howSelfService:
      'Open your Parent Dashboard to view all child profile data, learning progress, badges, session history, and a complete record of Prompt Lab interactions retained under our daily-purge schedule.',
    howContact:
      'Email privacy@sparkforge-labs.com with the subject line "COPPA Review Request" and the display name or internal ID of the child profile involved. We will confirm your identity (see below) and respond with a complete data export within 10 business days.',
    action: { label: 'Open Parent Dashboard', href: '/parent' },
  },
  {
    id: 'delete',
    icon: Trash2,
    accent: 'amber',
    title: 'Right to deletion',
    statute: '16 CFR 312.6(a)(2)',
    summary:
      "You may request deletion of any or all personal information SparkForge has collected from your child.",
    howSelfService:
      'In the Parent Dashboard, select the child profile and use Delete Profile. Every associated record — progress, sessions, prompt history, badges — is removed by cascading deletion; Prompt Lab history is already purged daily.',
    howContact:
      'Email privacy@sparkforge-labs.com with the subject line "COPPA Deletion Request" if you prefer a guided deletion, need a specific subset deleted, or are unable to access the account.',
    action: { label: 'Delete a child profile', href: '/parent' },
  },
  {
    id: 'refuse',
    icon: ShieldOff,
    accent: 'purple',
    title: 'Right to refuse further collection',
    statute: '16 CFR 312.6(a)(3)',
    summary:
      "You may direct us to stop collecting or using personal information from your child without deleting the existing account.",
    howSelfService:
      "We don't currently offer a single in-app toggle for this. In practice, pausing the child profile achieves the same result: no new data is collected while the profile is inactive.",
    howContact:
      'Email privacy@sparkforge-labs.com with the subject line "Refuse Further Collection" and we will place the profile in a no-new-collection state within 3 business days and confirm by email.',
    action: null,
  },
  {
    id: 'revoke',
    icon: KeyRound,
    accent: 'blue',
    title: 'Right to revoke consent',
    statute: '16 CFR 312.5',
    summary:
      "You may withdraw the verifiable parental consent you granted during signup. Revocation stops all further collection and results in deletion of previously collected data.",
    howSelfService:
      'Delete the child profile from the Parent Dashboard — this is treated as an automatic revocation of COPPA consent for that child.',
    howContact:
      'Email privacy@sparkforge-labs.com with the subject line "Revoke COPPA Consent" if you wish to revoke consent for all children associated with your account or retain the parent account without any child profiles.',
    action: null,
  },
  {
    id: 'controls',
    icon: SlidersHorizontal,
    accent: 'purple',
    title: 'Content filters and time limits',
    statute: 'COPPA best practice; mandated by CA AADC & MD AADC for teens',
    summary:
      "You may configure and review time limits, age-band restrictions, and content filters that shape what your child experiences in SparkForge.",
    howSelfService:
      'Open the Parent Dashboard to adjust daily time limits and review age-band content filters for each child profile.',
    howContact:
      'Email support@sparkforge-labs.com if you need help configuring controls or notice content that appears inappropriate for the selected age band.',
    action: { label: 'Manage controls', href: '/parent' },
  },
];

const ACCENT_MAP: Record<string, { bg: string; border: string; text: string }> = {
  blue:   { bg: 'bg-spark-blue/10',   border: 'border-spark-blue/20',   text: 'text-spark-blue' },
  purple: { bg: 'bg-spark-purple/10', border: 'border-spark-purple/20', text: 'text-spark-purple' },
  amber:  { bg: 'bg-spark-amber/10',  border: 'border-spark-amber/20',  text: 'text-spark-amber' },
};

export default function ParentalRightsPage() {
  return (
    <div className="pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-6">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-block px-3 py-1 rounded-full bg-spark-blue/10 border border-spark-blue/20 text-spark-blue text-xs font-data uppercase tracking-wider mb-4">
            COPPA 16 CFR &sect; 312.6
          </div>
          <h1 className="font-display text-4xl font-bold mb-3 bg-gradient-to-r from-spark-blue to-spark-purple bg-clip-text text-transparent">
            Parental Rights
          </h1>
          <p className="text-white/70 font-body leading-relaxed">
            Parents and legal guardians have real, statutory rights over their child&apos;s personal information.
            This page explains each right, how to exercise it (self-service or by request), how we verify your identity,
            and what to expect in response.
          </p>
        </div>

        <div className="space-y-10 font-body text-white/70 leading-relaxed">
          {/* ═══ The five rights ═══ */}
          <section id="rights" aria-labelledby="rights-heading">
            <h2 id="rights-heading" className="font-display text-xl font-semibold text-white mb-5">
              Your rights
            </h2>

            <div className="space-y-5">
              {RIGHTS.map((r) => {
                const Icon = r.icon;
                const accent = ACCENT_MAP[r.accent];
                return (
                  <div
                    key={r.id}
                    id={r.id}
                    className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.08]"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`shrink-0 w-10 h-10 rounded-lg ${accent.bg} border ${accent.border} flex items-center justify-center ${accent.text}`}>
                        <Icon className="w-5 h-5" strokeWidth={2} aria-hidden="true" />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1">
                          <h3 className="font-display text-lg font-semibold text-white">
                            {r.title}
                          </h3>
                          <span className="text-[11px] font-data uppercase tracking-wider text-white/40">
                            {r.statute}
                          </span>
                        </div>
                        <p className="text-sm text-white/80 mb-4">{r.summary}</p>

                        <div className="grid grid-cols-1 gap-3 text-sm">
                          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                            <p className="text-xs font-data uppercase tracking-wider text-white/50 mb-1.5">
                              Self-service
                            </p>
                            <p className="text-white/70">{r.howSelfService}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                            <p className="text-xs font-data uppercase tracking-wider text-white/50 mb-1.5">
                              By written request
                            </p>
                            <p className="text-white/70">{r.howContact}</p>
                          </div>
                        </div>

                        {r.action && (
                          <div className="mt-4">
                            <Link
                              href={r.action.href}
                              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg ${accent.bg} border ${accent.border} ${accent.text} text-xs font-data uppercase tracking-wider hover:opacity-90 transition-opacity`}
                            >
                              {r.action.label}
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ═══ Identity verification ═══ */}
          <section id="verification">
            <h2 className="font-display text-xl font-semibold text-white mb-3">
              How we verify your identity
            </h2>
            <p className="mb-3">
              COPPA requires that we confirm the requester is in fact the parent or legal guardian before releasing,
              altering, or deleting a child&apos;s personal information. We use a least-burdensome verification consistent
              with the nature of the request:
            </p>
            <ul className="list-disc list-inside space-y-2 text-white/80 ml-2">
              <li>
                <strong className="text-white">Authenticated dashboard actions</strong> (review, delete, adjust controls)
                &mdash; identity is verified by your login session. No additional steps required.
              </li>
              <li>
                <strong className="text-white">Emailed requests</strong> &mdash; we reply to the verified email address on
                the account and require confirmation of a one-time link before executing the request.
              </li>
              <li>
                <strong className="text-white">Account-recovery scenarios</strong> &mdash; if you no longer have access to
                the registered email, we may ask you to confirm details about the account (signup date, last billing amount,
                registered child display name) that only the account holder would know.
              </li>
            </ul>
            <p className="mt-3 text-sm text-white/60">
              We will never ask you for a photograph of a government-issued identification document to exercise these rights.
              If you receive such a request claiming to be from SparkForge, report it to{' '}
              <a href="mailto:privacy@sparkforge-labs.com" className="text-spark-blue hover:underline">privacy@sparkforge-labs.com</a>.
            </p>
          </section>

          {/* ═══ Response SLA ═══ */}
          <section id="sla">
            <h2 className="font-display text-xl font-semibold text-white mb-3">
              Response commitments
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { t: 'Acknowledge', d: 'Within 2 business days', note: 'Automated confirmation of receipt + ticket ID.' },
                { t: 'Verify identity', d: 'Within 3 business days', note: 'We send a confirmation link to your registered email.' },
                { t: 'Fulfill request', d: 'Within 10 business days', note: 'Review exports, deletions, or other actions completed.' },
              ].map((s) => (
                <div key={s.t} className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <p className="font-data uppercase text-xs tracking-wider text-white/50 mb-1">{s.t}</p>
                  <p className="text-white font-semibold">{s.d}</p>
                  <p className="text-xs text-white/60 mt-1.5">{s.note}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm text-white/70">
              If your request requires more time (for example, coordinating deletion across multiple data systems), we will
              send a status update before day 10 and an estimated completion date. COPPA&apos;s deletion obligation
              (16 CFR 312.10) always takes priority.
            </p>
          </section>

          {/* ═══ Escalation ═══ */}
          <section id="escalation">
            <h2 className="font-display text-xl font-semibold text-white mb-3">
              If we don&apos;t meet these commitments
            </h2>
            <p className="mb-3">
              If you believe SparkForge has failed to honor a parental right, you may:
            </p>
            <ul className="list-disc list-inside space-y-2 text-white/80 ml-2">
              <li>
                Escalate to our privacy team by emailing{' '}
                <a href="mailto:legal@sparkforge-labs.com" className="text-spark-blue hover:underline">legal@sparkforge-labs.com</a>
                {' '}with &quot;Escalation&quot; in the subject line.
              </li>
              <li>
                File a complaint with the{' '}
                <a href="https://www.ftc.gov/complaint" className="text-spark-blue hover:underline" target="_blank" rel="noopener noreferrer">
                  Federal Trade Commission
                </a>
                {' '}(the COPPA enforcement authority).
              </li>
              <li>
                Contact your state Attorney General&apos;s consumer protection division &mdash; many state laws (CCPA/CPRA in
                California, VCDPA in Virginia, MD AADC in Maryland, and others) give additional rights that layer on top of
                federal COPPA protections.
              </li>
            </ul>
          </section>

          {/* ═══ Contact ═══ */}
          <section id="contact">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-spark-blue/10 border border-spark-blue/20 flex items-center justify-center text-spark-blue">
                <Mail className="w-5 h-5" strokeWidth={2} aria-hidden="true" />
              </div>
              <h2 className="font-display text-xl font-semibold text-white">
                Submit a request
              </h2>
            </div>
            <div className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <p className="text-sm text-white/70">
                <strong className="text-white">SparkForge LLC &mdash; Privacy Team</strong> <span className="text-white/40">(an Illinois limited liability company)</span><br />
                Mailing address: <span className="text-white/70">[MAILING ADDRESS &mdash; to be finalized before production launch]</span><br />
                Telephone: <a href="tel:+17736292320" className="text-spark-blue hover:underline">(773) 629-2320</a><br />
                Email: <a href="mailto:privacy@sparkforge-labs.com" className="text-spark-blue hover:underline">privacy@sparkforge-labs.com</a><br />
                Preferred subject lines: &quot;COPPA Review Request&quot;, &quot;COPPA Deletion Request&quot;, &quot;Refuse Further Collection&quot;, &quot;Revoke COPPA Consent&quot;.
              </p>
            </div>
            <p className="mt-3 text-sm text-white/60">
              See also the full{' '}
              <Link href="/privacy" className="text-spark-blue hover:underline">Privacy Policy</Link>{' '}
              and the{' '}
              <Link href="/privacy/children" className="text-spark-blue hover:underline">children&apos;s privacy notice</Link>.
            </p>
          </section>

          {/* Legal review notice */}
          <div className="mt-12 p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <p className="text-xs text-amber-400/70 font-body">
              <strong className="text-amber-400/90">LEGAL REVIEW REQUIRED:</strong> This parental-rights page has been drafted
              to align with COPPA 16 CFR &sect; 312.6 (review, deletion, refusal, revocation) and 16 CFR &sect; 312.10
              (data minimization and deletion). It should be reviewed by qualified legal counsel before production deployment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
