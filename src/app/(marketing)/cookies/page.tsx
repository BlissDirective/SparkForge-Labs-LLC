import { Metadata } from 'next';
import Link from 'next/link';
import { Cookie, ShieldCheck, MonitorSmartphone } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Cookie Policy — SparkForge',
  description:
    'A complete inventory of cookies and persistent identifiers used by SparkForge, why each is set, how long it lasts, and how to control them in your browser.',
};

// ════════════════════════════════════════════════════
// COOKIE POLICY — companion to Privacy §9
// Aligned with COPPA FAQ A.3 (persistent identifiers as PI),
// the COPPA "support for internal operations" exception, and CCPA/CPRA
// cookie disclosure requirements.
// LEGAL REVIEW REQUIRED before production launch.
// ════════════════════════════════════════════════════

const COOKIES = [
  {
    name: 'sb-* (Supabase auth)',
    setBy: 'SparkForge (first-party, via Supabase Auth SDK)',
    type: 'HTTP cookie (httpOnly, Secure, SameSite=Lax)',
    purpose: 'Maintains your authenticated session so you do not have to log in on every page load. Refresh token enables silent renewal.',
    duration: 'Session for access token; up to 7 days for refresh token',
    coppaBasis: 'Authentication is "support for internal operations" under 16 CFR § 312.2',
  },
  {
    name: 'sparkforge-active-child',
    setBy: 'SparkForge (first-party, localStorage)',
    type: 'localStorage (not a transmitted cookie)',
    purpose: 'Remembers which child profile was last selected so the child returns to their own dashboard.',
    duration: 'Persists until manually cleared or the child profile is deleted',
    coppaBasis: 'Personalization for the same registered child; "support for internal operations"',
  },
  {
    name: 'sparkforge-demo-active',
    setBy: 'SparkForge (first-party, sessionStorage)',
    type: 'sessionStorage flag with expiry timestamp',
    purpose: 'Indicates an active demo session and tracks the 1-hour session timer.',
    duration: '1 hour maximum (deleted at session expiry)',
    coppaBasis: 'No PI is collected during demo mode; flag is functional only',
  },
  {
    name: 'sparkforge-skip-intro',
    setBy: 'SparkForge (first-party, localStorage)',
    type: 'localStorage preference',
    purpose: 'Records your preference to skip the intro animation on subsequent visits.',
    duration: 'Persists until manually cleared',
    coppaBasis: 'Pure UI preference; not a tracking identifier',
  },
];

export default function CookiePolicyPage() {
  return (
    <div className="pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-6">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-block px-3 py-1 rounded-full bg-spark-blue/10 border border-spark-blue/20 text-spark-blue text-xs font-data uppercase tracking-wider mb-4">
            Cookies &amp; Identifiers
          </div>
          <h1 className="font-display text-4xl font-bold mb-3 bg-gradient-to-r from-spark-blue to-spark-purple bg-clip-text text-transparent">
            Cookie Policy
          </h1>
          <p className="text-white/70 font-body">
            Effective Date: April 23, 2026 &middot; Last Updated: April 23, 2026
          </p>
        </div>

        <div className="space-y-10 font-body text-white/70 leading-relaxed">
          {/* ═══ 1. What we use, in one sentence ═══ */}
          <section id="summary">
            <div className="p-4 rounded-lg bg-spark-blue/5 border border-spark-blue/20">
              <p className="text-sm text-white/80">
                <strong className="text-white">SparkForge uses four first-party cookies/storage items.</strong>{' '}
                We do not use any analytics cookies, advertising pixels, third-party tracking scripts, or any
                cross-site/cross-app tracking technologies. We do not sell or share information derived from cookies.
              </p>
            </div>
          </section>

          {/* ═══ 2. What is a cookie? ═══ */}
          <section id="what">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-spark-blue/10 border border-spark-blue/20 flex items-center justify-center text-spark-blue">
                <Cookie className="w-5 h-5" strokeWidth={2} aria-hidden="true" />
              </div>
              <h2 className="font-display text-xl font-semibold text-white">
                1. What is a cookie?
              </h2>
            </div>
            <p>
              A &quot;cookie&quot; is a small text file a website stores in your browser. It can hold information like a session
              ID so the site recognizes you on later visits. Modern web apps also use related browser-storage features
              such as <code className="text-xs bg-white/[0.06] px-1 py-0.5 rounded">localStorage</code> and{' '}
              <code className="text-xs bg-white/[0.06] px-1 py-0.5 rounded">sessionStorage</code>; for clarity we treat all
              of them collectively as &quot;cookies and persistent identifiers&quot; in this policy.
            </p>
            <p className="mt-3">
              Under COPPA FAQ A.3, persistent identifiers that recognize a user over time and across services count as
              personal information. SparkForge uses persistent identifiers <strong className="text-white">only for the
              limited &quot;support for internal operations&quot; purposes</strong> permitted under 16 CFR § 312.2.
            </p>
          </section>

          {/* ═══ 3. The complete inventory ═══ */}
          <section id="inventory">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-spark-purple/10 border border-spark-purple/20 flex items-center justify-center text-spark-purple">
                <ShieldCheck className="w-5 h-5" strokeWidth={2} aria-hidden="true" />
              </div>
              <h2 className="font-display text-xl font-semibold text-white">
                2. Complete inventory
              </h2>
            </div>
            <p className="mb-4">
              Every cookie or persistent identifier SparkForge sets is listed below. If you find a storage item not in
              this list, please report it to{' '}
              <a href="mailto:privacy@sparkforge-labs.com" className="text-spark-blue hover:underline">privacy@sparkforge-labs.com</a>.
            </p>

            <div className="space-y-3">
              {COOKIES.map((c) => (
                <div key={c.name} className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.08]">
                  <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                    <h3 className="font-display text-base font-semibold text-white">
                      <code className="text-sm bg-white/[0.06] px-1.5 py-0.5 rounded">{c.name}</code>
                    </h3>
                    <span className="text-[11px] font-data uppercase tracking-wider text-white/40">
                      First-party
                    </span>
                  </div>
                  <div className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5 text-xs text-white/70">
                    <span className="text-white/50">Set by:</span>
                    <span>{c.setBy}</span>
                    <span className="text-white/50">Type:</span>
                    <span>{c.type}</span>
                    <span className="text-white/50">Purpose:</span>
                    <span>{c.purpose}</span>
                    <span className="text-white/50">Duration:</span>
                    <span>{c.duration}</span>
                    <span className="text-white/50">COPPA basis:</span>
                    <span>{c.coppaBasis}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ═══ 4. What we do not use ═══ */}
          <section id="not-used">
            <h2 className="font-display text-xl font-semibold text-white mb-3">
              3. What we do not use
            </h2>
            <ul className="list-disc list-inside space-y-2 text-white/80 ml-2">
              <li>No third-party analytics cookies (no Google Analytics, no Mixpanel, no Hotjar, no Heap, no Amplitude).</li>
              <li>No advertising pixels (no Meta Pixel, no Google Ads tag, no TikTok Pixel, no LinkedIn Insight).</li>
              <li>No social-media share trackers (no Facebook Like button, no Twitter widget cookies).</li>
              <li>No data-broker tags or audience-segmentation pixels.</li>
              <li>No fingerprinting via canvas, WebGL, font enumeration, or audio-context probing.</li>
              <li>No cross-site or cross-app tracking technologies.</li>
            </ul>
          </section>

          {/* ═══ 5. Browser controls ═══ */}
          <section id="controls">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-spark-amber/10 border border-spark-amber/20 flex items-center justify-center text-spark-amber">
                <MonitorSmartphone className="w-5 h-5" strokeWidth={2} aria-hidden="true" />
              </div>
              <h2 className="font-display text-xl font-semibold text-white">
                4. How to control cookies in your browser
              </h2>
            </div>
            <p className="mb-3">
              You can clear or block cookies and storage items at any time from your browser&apos;s settings:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-white/80 ml-2">
              <li>
                <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-spark-blue hover:underline">
                  Google Chrome
                </a>{' '}&mdash; Settings &rarr; Privacy and security &rarr; Cookies and other site data
              </li>
              <li>
                <a href="https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox" target="_blank" rel="noopener noreferrer" className="text-spark-blue hover:underline">
                  Mozilla Firefox
                </a>{' '}&mdash; Settings &rarr; Privacy &amp; Security &rarr; Cookies and Site Data
              </li>
              <li>
                <a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-spark-blue hover:underline">
                  Apple Safari
                </a>{' '}&mdash; Preferences &rarr; Privacy
              </li>
              <li>
                <a href="https://support.microsoft.com/en-us/windows/manage-cookies-in-microsoft-edge-168dab11-0753-043d-7c16-ede5947fc64d" target="_blank" rel="noopener noreferrer" className="text-spark-blue hover:underline">
                  Microsoft Edge
                </a>{' '}&mdash; Settings &rarr; Cookies and site permissions
              </li>
            </ul>
            <p className="mt-3 text-sm text-white/70">
              <strong className="text-white">Note:</strong> Blocking the Supabase authentication cookie will sign you out
              and prevent you from using SparkForge while logged in. Demo mode will continue to work.
            </p>
            <p className="mt-3 text-sm text-white/70">
              SparkForge honors the{' '}
              <a href="https://globalprivacycontrol.org/" target="_blank" rel="noopener noreferrer" className="text-spark-blue hover:underline">
                Global Privacy Control (GPC)
              </a>{' '}
              browser signal where applicable. Because we do not engage in any &quot;sale&quot; or &quot;sharing&quot; of personal
              information as defined under the CCPA/CPRA, GPC has no additional effect on first-party functional cookies, but
              we treat any future analytics or advertising integrations as opted-out by default for visitors transmitting GPC.
            </p>
          </section>

          {/* ═══ 6. Changes ═══ */}
          <section id="changes">
            <h2 className="font-display text-xl font-semibold text-white mb-3">
              5. Changes to this Cookie Policy
            </h2>
            <p>
              If we add or remove a cookie or persistent identifier, we will update the inventory above and bump the
              &quot;Last Updated&quot; date. If a change materially affects how children&apos;s data is processed, we will obtain
              new parental consent before the change takes effect, consistent with our{' '}
              <Link href="/privacy" className="text-spark-blue hover:underline">Privacy Policy</Link>.
            </p>
          </section>

          {/* ═══ 7. Contact ═══ */}
          <section id="contact">
            <h2 className="font-display text-xl font-semibold text-white mb-3">
              6. Questions
            </h2>
            <div className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <p className="text-sm text-white/70">
                <strong className="text-white">SparkForge LLC &mdash; Privacy Team</strong> <span className="text-white/40">(an Illinois limited liability company)</span><br />
                Telephone: <a href="tel:+17736292320" className="text-spark-blue hover:underline">(773) 629-2320</a><br />
                Email: <a href="mailto:privacy@sparkforge-labs.com" className="text-spark-blue hover:underline">privacy@sparkforge-labs.com</a>
              </p>
            </div>
            <p className="mt-3 text-sm text-white/60">
              See also our full{' '}
              <Link href="/privacy" className="text-spark-blue hover:underline">Privacy Policy</Link>
              {' '}and{' '}
              <Link href="/privacy/children" className="text-spark-blue hover:underline">children&apos;s privacy notice</Link>.
            </p>
          </section>

          {/* Legal review notice */}
          <div className="mt-12 p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <p className="text-xs text-amber-400/70 font-body">
              <strong className="text-amber-400/90">LEGAL REVIEW REQUIRED:</strong> This cookie policy has been drafted to
              align with COPPA FAQ A.3 (persistent-identifier treatment), the 16 CFR § 312.2 &quot;support for internal
              operations&quot; exception, and CCPA/CPRA cookie-disclosure expectations. It should be reviewed by qualified
              legal counsel before production deployment. The cookie inventory must be re-verified against runtime behavior
              before each release.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
