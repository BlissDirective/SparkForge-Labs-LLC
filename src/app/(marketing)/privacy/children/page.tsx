import { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Eye, Lock, Heart, Sparkles, HelpCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: "Your Privacy — SparkForge for Kids",
  description:
    "A kid-friendly explanation of what SparkForge knows about you, who sees it, and the powers you have over your own information.",
};

// ════════════════════════════════════════════════════
// CHILDREN'S PRIVACY NOTICE — kid-friendly summary
// Aligns with COPPA 16 CFR 312.4(c) direct-notice principles and the
// Common Sense Privacy rubric's six child-facing commitments.
// Companion to the parent-facing /privacy page; not a substitute for it.
// LEGAL REVIEW REQUIRED before production launch.
// ════════════════════════════════════════════════════

export default function ChildrensPrivacyPage() {
  return (
    <div className="pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-6">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-block px-3 py-1 rounded-full bg-spark-purple/10 border border-spark-purple/20 text-spark-purple text-xs font-data uppercase tracking-wider mb-4">
            For Kids &middot; Ages 7&ndash;16
          </div>
          <h1 className="font-display text-4xl font-bold mb-3 bg-gradient-to-r from-spark-blue to-spark-purple bg-clip-text text-transparent">
            Your Privacy, Explained
          </h1>
          <p className="text-white/70 font-body leading-relaxed">
            Hey! This page tells you, in plain words, what SparkForge knows about you and what we do with it.
            We wrote this so you can read it yourself. If anything is confusing, ask a grown-up to help.
          </p>
        </div>

        <div className="space-y-10 font-body text-white/70 leading-relaxed text-[17px]">
          {/* ═══ 1. What we save ═══ */}
          <section id="what-we-save">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-spark-blue/10 border border-spark-blue/20 flex items-center justify-center text-spark-blue">
                <Eye className="w-5 h-5" strokeWidth={2} aria-hidden="true" />
              </div>
              <h2 className="font-display text-xl font-semibold text-white">
                1. What we save about you
              </h2>
            </div>
            <p className="mb-3">
              SparkForge only saves the stuff we need to make your learning lab work. Here&apos;s the whole list:
            </p>
            <ul className="list-disc list-inside space-y-2 text-white/80 ml-2">
              <li><strong className="text-white">Your display name</strong> &mdash; whatever your grown-up picked (it doesn&apos;t have to be your real name).</li>
              <li><strong className="text-white">Your age group</strong> &mdash; A (7&ndash;9), B (10&ndash;12), or C (13&ndash;16). Not your exact birthday.</li>
              <li><strong className="text-white">Your avatar choices</strong> &mdash; the look you picked for your character.</li>
              <li><strong className="text-white">What you&apos;ve played</strong> &mdash; which games, scores, XP, badges, and streaks.</li>
              <li><strong className="text-white">How long you played</strong> &mdash; so your grown-up can set time limits.</li>
              <li><strong className="text-white">Prompt Lab questions</strong> &mdash; if you&apos;re in age group C (14&ndash;16), the things you type in Prompt Lab. These are erased every single day.</li>
            </ul>

            <div className="mt-5 p-4 rounded-lg bg-spark-blue/5 border border-spark-blue/20">
              <p className="text-sm text-white/80">
                <strong className="text-white">We do NOT save:</strong> your real name, your birthday, your face or voice,
                where you live, your phone number, or anything about your friends or family.
              </p>
            </div>
          </section>

          {/* ═══ 2. Who sees it ═══ */}
          <section id="who-sees">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-spark-purple/10 border border-spark-purple/20 flex items-center justify-center text-spark-purple">
                <Heart className="w-5 h-5" strokeWidth={2} aria-hidden="true" />
              </div>
              <h2 className="font-display text-xl font-semibold text-white">
                2. Who can see your stuff
              </h2>
            </div>
            <ul className="list-disc list-inside space-y-2 text-white/80 ml-2">
              <li><strong className="text-white">You</strong> &mdash; always.</li>
              <li><strong className="text-white">Your grown-up</strong> &mdash; the parent or guardian who made your account. They can see your progress and badges from their Parent Dashboard.</li>
              <li><strong className="text-white">The SparkForge crew</strong> &mdash; only the people who build and fix the platform, and only when they need to help your account work.</li>
            </ul>
            <p className="mt-3">
              That&apos;s it. Your stuff never goes to advertisers, other companies, or strangers on the internet.
            </p>
          </section>

          {/* ═══ 3. What we never do ═══ */}
          <section id="never">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-spark-amber/10 border border-spark-amber/20 flex items-center justify-center text-spark-amber">
                <Shield className="w-5 h-5" strokeWidth={2} aria-hidden="true" />
              </div>
              <h2 className="font-display text-xl font-semibold text-white">
                3. Six things we promise we will never do
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { n: '1', t: 'No ads to kids', d: 'You will never see advertisements in SparkForge. Ever.' },
                { n: '2', t: 'No selling your info', d: 'We don’t sell, rent, or trade your information to anyone.' },
                { n: '3', t: 'No targeted ads', d: 'We don’t use what you do here to show you ads somewhere else.' },
                { n: '4', t: 'No tracking you', d: 'We don’t follow you around the web or into other apps.' },
                { n: '5', t: 'No profiling', d: 'We don’t build a profile about you for companies to use.' },
                { n: '6', t: 'No data brokers', d: 'We don’t share your information with data brokers or marketers.' },
              ].map((item) => (
                <div
                  key={item.n}
                  className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.08]"
                >
                  <p className="text-sm">
                    <span className="inline-block w-5 h-5 rounded-full bg-spark-blue/20 text-spark-blue text-xs font-data leading-5 text-center mr-2">{item.n}</span>
                    <strong className="text-white">{item.t}.</strong>{' '}
                    <span className="text-white/70">{item.d}</span>
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ═══ 4. How long we keep it ═══ */}
          <section id="how-long">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-spark-blue/10 border border-spark-blue/20 flex items-center justify-center text-spark-blue">
                <Lock className="w-5 h-5" strokeWidth={2} aria-hidden="true" />
              </div>
              <h2 className="font-display text-xl font-semibold text-white">
                4. How long we keep your stuff
              </h2>
            </div>
            <ul className="list-disc list-inside space-y-2 text-white/80 ml-2">
              <li><strong className="text-white">While you&apos;re here:</strong> we keep your progress so you can pick up where you left off.</li>
              <li><strong className="text-white">Prompt Lab questions:</strong> erased every day, automatically.</li>
              <li><strong className="text-white">When your grown-up deletes your profile:</strong> everything is removed for good.</li>
              <li><strong className="text-white">Demo mode:</strong> nothing is saved &mdash; it all disappears when you leave.</li>
            </ul>
          </section>

          {/* ═══ 5. Your powers ═══ */}
          <section id="your-powers">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-spark-purple/10 border border-spark-purple/20 flex items-center justify-center text-spark-purple">
                <Sparkles className="w-5 h-5" strokeWidth={2} aria-hidden="true" />
              </div>
              <h2 className="font-display text-xl font-semibold text-white">
                5. Your powers over your own info
              </h2>
            </div>
            <p className="mb-3">
              You have real rights here. Ask your grown-up to help you use any of these at any time:
            </p>
            <ul className="list-disc list-inside space-y-2 text-white/80 ml-2">
              <li><strong className="text-white">See what we have:</strong> your grown-up can see everything in the Parent Dashboard.</li>
              <li><strong className="text-white">Delete it all:</strong> your grown-up can delete your profile and wipe your data.</li>
              <li><strong className="text-white">Stop new stuff:</strong> your grown-up can ask us to stop collecting anything new.</li>
              <li><strong className="text-white">Change your mind:</strong> your grown-up can take back their permission any time.</li>
            </ul>
            <p className="mt-3 text-sm text-white/70">
              Grown-ups can use the{' '}
              <Link href="/privacy/rights" className="text-spark-blue hover:underline">
                Parental Rights page
              </Link>{' '}
              to make any of these requests.
            </p>
          </section>

          {/* ═══ 6. If something feels wrong ═══ */}
          <section id="feels-wrong">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-spark-amber/10 border border-spark-amber/20 flex items-center justify-center text-spark-amber">
                <HelpCircle className="w-5 h-5" strokeWidth={2} aria-hidden="true" />
              </div>
              <h2 className="font-display text-xl font-semibold text-white">
                6. If something feels wrong
              </h2>
            </div>
            <p>
              If you ever see something weird, scary, or unfair inside SparkForge &mdash; or if someone is asking you for
              information we just told you we don&apos;t collect &mdash; tell a grown-up right away. Your grown-up can email us at{' '}
              <a href="mailto:privacy@sparkforge-labs.com" className="text-spark-blue hover:underline">
                privacy@sparkforge-labs.com
              </a>
              , and we&apos;ll fix it.
            </p>
          </section>

          {/* ═══ For grown-ups ═══ */}
          <section id="for-grownups" className="pt-6 border-t border-white/[0.06]">
            <h2 className="font-display text-xl font-semibold text-white mb-3">
              For grown-ups reading this
            </h2>
            <p className="text-white/70 mb-3">
              This page is a plain-language summary for children. It is a companion to &mdash; not a replacement for &mdash; our
              full Privacy Policy, which contains the complete disclosures required under the Children&apos;s Online Privacy
              Protection Act (COPPA) and applicable state laws.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/privacy"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-spark-blue/10 border border-spark-blue/30 text-spark-blue hover:bg-spark-blue/15 transition-colors text-sm"
              >
                Read the full Privacy Policy
              </Link>
              <Link
                href="/privacy/rights"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-white/80 hover:bg-white/[0.06] transition-colors text-sm"
              >
                Exercise parental rights
              </Link>
            </div>
          </section>

          {/* Legal review notice */}
          <div className="mt-12 p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <p className="text-xs text-amber-400/70 font-body">
              <strong className="text-amber-400/90">LEGAL REVIEW REQUIRED:</strong> This children&apos;s privacy notice has
              been drafted as a plain-language companion to the main Privacy Policy, aligned with 16 CFR 312.4(c) direct-notice
              principles and the Common Sense Privacy rubric. It should be reviewed by qualified legal counsel before
              production deployment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
