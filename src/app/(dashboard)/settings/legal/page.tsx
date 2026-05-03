import { Metadata } from 'next';
import Link from 'next/link';
import {
  FileText,
  Shield,
  Baby,
  Cookie,
  ScrollText,
  ShieldCheck,
  FileSearch,
  Mail,
  CreditCard,
  Download,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Legal & Privacy — Settings — SparkForge',
  description:
    "Review SparkForge's legal and privacy documents, and take quick actions such as submitting a parental-rights request, exporting your child's data, or managing your subscription.",
};

// ════════════════════════════════════════════════════════════════
// /settings/legal — Parent-dashboard Legal & Privacy hub
// ════════════════════════════════════════════════════════════════
// One-stop index for every legal/policy surface in the app, plus
// shortcut actions for the most common parental rights workflows.
// Matches the layout of /settings/sessions and /settings/linked-accounts.
// Server component (no client state needed).

const LEGAL_DOCUMENTS = [
  {
    href: '/privacy',
    icon: Shield,
    title: 'Privacy Policy',
    desc: 'How we collect, use, and protect personal information. COPPA-compliant, with state-law supplements and international transfer safeguards.',
    badge: 'Required reading',
  },
  {
    href: '/privacy/children',
    icon: Baby,
    title: "Children's Privacy Notice",
    desc: 'A plain-language summary written for children ages 7–16 to read themselves. Companion to the full Privacy Policy.',
    badge: 'Kid-friendly',
  },
  {
    href: '/privacy/rights',
    icon: FileSearch,
    title: 'Parental Rights',
    desc: 'Exercise your rights under COPPA 16 CFR § 312.6 — review, delete, refuse further collection, or revoke consent for your child.',
    badge: 'Action page',
  },
  {
    href: '/terms',
    icon: FileText,
    title: 'Terms of Service',
    desc: 'Platform agreement, subscription terms, auto-renewal disclosures, acceptable use, AI content terms, and dispute resolution.',
    badge: null,
  },
  {
    href: '/cookies',
    icon: Cookie,
    title: 'Cookie Policy',
    desc: 'Complete inventory of cookies and persistent identifiers, with COPPA basis for each and browser-control instructions.',
    badge: null,
  },
  {
    href: '/dmca',
    icon: ScrollText,
    title: 'DMCA Policy',
    desc: 'Copyright-infringement notice and counter-notice procedures, repeat-infringer policy, and our designated agent.',
    badge: null,
  },
];

const QUICK_ACTIONS = [
  {
    href: '/privacy/rights',
    icon: ShieldCheck,
    label: 'Exercise a parental right',
    desc: 'Review, delete, refuse collection, or revoke consent',
  },
  {
    href: '/parent/export',
    icon: Download,
    label: "Export your child's data",
    desc: 'Download a portable copy of account and progress data',
  },
  {
    href: '/parent/subscription',
    icon: CreditCard,
    label: 'Manage subscription',
    desc: 'Cancel, change tier, or update payment method',
  },
  {
    href: 'mailto:privacy@sparkforge-labs.com',
    icon: Mail,
    label: 'Contact the privacy team',
    desc: 'privacy@sparkforge-labs.com · (773) 629-2320',
    external: true,
  },
];

export default function LegalSettingsPage() {
  return (
    <main className="min-h-screen bg-[#06070e] px-6 py-10 text-white/90">
      <div className="max-w-3xl mx-auto">
        <div className="mb-2 text-xs font-data uppercase tracking-wider text-white/50">
          Settings
        </div>
        <h1 className="text-2xl font-semibold mb-1 text-white">Legal &amp; Privacy</h1>
        <p className="text-white/60 mb-8">
          Review the documents that govern your use of SparkForge and take quick action on your privacy rights.
        </p>

        {/* Quick actions */}
        <section className="mb-10" aria-labelledby="quick-actions-heading">
          <h2 id="quick-actions-heading" className="text-xs font-data uppercase tracking-wider text-white/50 mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              const content = (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-white/[0.03] border border-white/[0.08] hover:border-spark-blue/30 hover:bg-spark-blue/[0.04] transition-colors h-full">
                  <div className="shrink-0 w-9 h-9 rounded-md bg-spark-blue/10 border border-spark-blue/20 flex items-center justify-center text-spark-blue">
                    <Icon className="w-4.5 h-4.5" strokeWidth={2} aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-white">{action.label}</p>
                    <p className="text-xs text-white/55 mt-0.5">{action.desc}</p>
                  </div>
                </div>
              );
              return action.external ? (
                <a key={action.href} href={action.href} className="block">
                  {content}
                </a>
              ) : (
                <Link key={action.href} href={action.href} className="block">
                  {content}
                </Link>
              );
            })}
          </div>
        </section>

        {/* Legal documents */}
        <section aria-labelledby="docs-heading">
          <h2 id="docs-heading" className="text-xs font-data uppercase tracking-wider text-white/50 mb-3">
            Legal Documents
          </h2>
          <ul className="space-y-3">
            {LEGAL_DOCUMENTS.map((doc) => {
              const Icon = doc.icon;
              return (
                <li key={doc.href}>
                  <Link
                    href={doc.href}
                    className="flex items-start gap-4 p-4 rounded-lg bg-white/[0.03] border border-white/[0.08] hover:border-spark-purple/30 hover:bg-spark-purple/[0.04] transition-colors"
                  >
                    <div className="shrink-0 w-10 h-10 rounded-md bg-spark-purple/10 border border-spark-purple/20 flex items-center justify-center text-spark-purple">
                      <Icon className="w-5 h-5" strokeWidth={2} aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-3 mb-1">
                        <p className="font-display text-base font-semibold text-white">
                          {doc.title}
                        </p>
                        {doc.badge && (
                          <span className="shrink-0 text-[10px] font-data uppercase tracking-wider text-spark-blue px-2 py-0.5 rounded-full bg-spark-blue/10 border border-spark-blue/20">
                            {doc.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-white/60">{doc.desc}</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Operator contact footer */}
        <section className="mt-10 p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]" aria-labelledby="operator-heading">
          <h2 id="operator-heading" className="text-xs font-data uppercase tracking-wider text-white/50 mb-2">
            Operator
          </h2>
          <p className="text-sm text-white/70">
            <strong className="text-white">SparkForge LLC</strong> <span className="text-white/50">(an Illinois limited liability company)</span>
          </p>
          <p className="text-xs text-white/55 mt-1">
            Telephone: <a href="tel:+17736292320" className="text-spark-blue hover:underline">(773) 629-2320</a>
            {' '}&middot;{' '}
            Support: <a href="mailto:support@sparkforge-labs.com" className="text-spark-blue hover:underline">support@sparkforge-labs.com</a>
            {' '}&middot;{' '}
            Privacy: <a href="mailto:privacy@sparkforge-labs.com" className="text-spark-blue hover:underline">privacy@sparkforge-labs.com</a>
            {' '}&middot;{' '}
            Legal: <a href="mailto:legal@sparkforge-labs.com" className="text-spark-blue hover:underline">legal@sparkforge-labs.com</a>
          </p>
          <p className="text-xs text-white/50 mt-2">
            File federal COPPA complaints at{' '}
            <a href="https://www.ftc.gov/complaint" target="_blank" rel="noopener noreferrer" className="text-spark-blue hover:underline">
              ftc.gov/complaint
            </a>.
          </p>
        </section>
      </div>
    </main>
  );
}
