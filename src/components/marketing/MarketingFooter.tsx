import Link from 'next/link';
import { Zap } from 'lucide-react';

const FOOTER_SECTIONS = [
  {
    title: 'Platform',
    links: [
      { href: '/', label: 'Home' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/signup', label: 'Get Started' },
      { href: '/login', label: 'Log In' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacy Policy' },
      { href: '/coppa-notice', label: 'COPPA Notice' },
      { href: '/terms', label: 'Terms of Service' },
    ],
  },
  {
    title: 'Contact',
    links: [
      { href: 'mailto:privacy@sparkforge.app', label: 'Privacy Inquiries' },
      { href: 'mailto:legal@sparkforge.app', label: 'Legal' },
      { href: 'mailto:support@sparkforge.app', label: 'Support' },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer
      className="relative border-t border-white/[0.06]"
      role="contentinfo"
    >
      {/* Subtle aurora glow at top of footer */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-spark-blue/30 to-transparent"
        aria-hidden="true"
      />

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-4 gap-8">
          {/* Brand column */}
          <div className="col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-spark-purple to-spark-blue flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-display text-base font-bold text-white">
                SparkForge
              </span>
            </Link>
            <p className="text-sm font-body text-white/60 leading-relaxed">
              AI Learning Lab for curious minds ages 7&ndash;16. 10 labs, 35 games, built for the next generation.
            </p>
          </div>

          {/* Link columns */}
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="font-display text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">
                {section.title}
              </h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm font-body text-white/70 hover:text-white/70 transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-white/[0.04] flex items-center justify-between">
          <p className="text-xs font-body text-white/55">
            &copy; {new Date().getFullYear()} BlissDirective. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs font-body text-white/55">
            <span>COPPA Compliant</span>
            <span className="w-px h-3 bg-white/10" aria-hidden="true" />
            <span>No Ads &middot; No Tracking</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
