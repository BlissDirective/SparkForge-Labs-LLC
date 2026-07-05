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
  Scale,
} from 'lucide-react';
import BlurText from '@/components/bits/BlurText';

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
    <main className="min-h-screen px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-2 text-xs uppercase tracking-wider" style={{ color: '#8C94AC' }}>
          Settings
        </div>
        <h1
          className="text-2xl sm:text-3xl font-extrabold mb-1"
          style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}
        >
          <Scale className="w-7 h-7 inline mr-2" style={{ color: '#4F6EF7' }} />
          <BlurText text="Legal & Privacy" />
        </h1>
        <p className="text-sm mb-8" style={{ color: '#52586E' }}>
          Review the documents that govern your use of SparkForge and take quick action on your privacy rights.
        </p>

        {/* Quick actions */}
        <section className="mb-10" aria-labelledby="quick-actions-heading">
          <h2
            id="quick-actions-heading"
            className="text-xs uppercase tracking-wider mb-3"
            style={{ color: '#8C94AC' }}
          >
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              const content = (
                <div
                  className="flex items-start gap-3 p-4 rounded-xl h-full transition-shadow hover:shadow-sf-md"
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E6E9F4',
                    boxShadow: '0 8px 30px rgba(26,29,43,0.08)',
                  }}
                >
                  <div
                    className="shrink-0 w-9 h-9 rounded-md flex items-center justify-center"
                    style={{ background: 'rgba(79,110,247,0.1)', color: '#4F6EF7' }}
                  >
                    <Icon className="w-4.5 h-4.5" strokeWidth={2} aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ color: '#1A1D2B' }}>{action.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#52586E' }}>{action.desc}</p>
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
          <h2 id="docs-heading" className="text-xs uppercase tracking-wider mb-3" style={{ color: '#8C94AC' }}>
            Legal Documents
          </h2>
          <ul className="space-y-3">
            {LEGAL_DOCUMENTS.map((doc) => {
              const Icon = doc.icon;
              return (
                <li key={doc.href}>
                  <Link
                    href={doc.href}
                    className="flex items-start gap-4 p-4 rounded-xl transition-shadow hover:shadow-sf-md"
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E6E9F4',
                      boxShadow: '0 8px 30px rgba(26,29,43,0.08)',
                    }}
                  >
                    <div
                      className="shrink-0 w-10 h-10 rounded-md flex items-center justify-center"
                      style={{ background: 'rgba(233,69,245,0.1)', color: '#E945F5' }}
                    >
                      <Icon className="w-5 h-5" strokeWidth={2} aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-3 mb-1">
                        <p className="text-base font-semibold" style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}>
                          {doc.title}
                        </p>
                        {doc.badge && (
                          <span
                            className="shrink-0 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full"
                            style={{ color: '#4F6EF7', background: 'rgba(79,110,247,0.1)', border: '1px solid rgba(79,110,247,0.2)' }}
                          >
                            {doc.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-sm" style={{ color: '#52586E' }}>{doc.desc}</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Operator contact footer */}
        <section
          className="mt-10 p-4 rounded-xl"
          style={{ background: '#F8FAFF', border: '1px solid #E6E9F4' }}
          aria-labelledby="operator-heading"
        >
          <h2 id="operator-heading" className="text-xs uppercase tracking-wider mb-2" style={{ color: '#8C94AC' }}>
            Operator
          </h2>
          <p className="text-sm" style={{ color: '#52586E' }}>
            <strong style={{ color: '#1A1D2B' }}>SparkForge LLC</strong> <span style={{ color: '#8C94AC' }}>(an Illinois limited liability company)</span>
          </p>
          <p className="text-xs mt-1" style={{ color: '#52586E' }}>
            Telephone: <a href="tel:+17736292320" className="hover:underline" style={{ color: '#4F6EF7' }}>(773) 629-2320</a>
            {' '}&middot;{' '}
            Support: <a href="mailto:support@sparkforge-labs.com" className="hover:underline" style={{ color: '#4F6EF7' }}>support@sparkforge-labs.com</a>
            {' '}&middot;{' '}
            Privacy: <a href="mailto:privacy@sparkforge-labs.com" className="hover:underline" style={{ color: '#4F6EF7' }}>privacy@sparkforge-labs.com</a>
            {' '}&middot;{' '}
            Legal: <a href="mailto:legal@sparkforge-labs.com" className="hover:underline" style={{ color: '#4F6EF7' }}>legal@sparkforge-labs.com</a>
          </p>
          <p className="text-xs mt-2" style={{ color: '#8C94AC' }}>
            File federal COPPA complaints at{' '}
            <a href="https://www.ftc.gov/complaint" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: '#4F6EF7' }}>
              ftc.gov/complaint
            </a>.
          </p>
        </section>
      </div>
    </main>
  );
}
