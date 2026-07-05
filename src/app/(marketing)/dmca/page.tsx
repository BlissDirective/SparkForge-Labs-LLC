import { Metadata } from 'next';
import Link from 'next/link';
import { ScrollText, AlertTriangle, Reply, UserMinus } from 'lucide-react';
import BlurText from '@/components/bits/BlurText';

export const metadata: Metadata = {
  title: 'DMCA Policy — SparkForge',
  description:
    "SparkForge's Digital Millennium Copyright Act policy: how to submit a takedown notice, how to file a counter-notice, our repeat-infringer policy, and our designated agent for service.",
};

// ════════════════════════════════════════════════════
// DMCA POLICY — 17 U.S.C. § 512 safe-harbor compliance
// Required because SparkForge hosts user-submitted content (Prompt Lab
// inputs and outputs). Designated agent must be registered with the
// U.S. Copyright Office DMCA Directory before claiming safe harbor.
// LEGAL REVIEW REQUIRED before production launch.
// ════════════════════════════════════════════════════

export default function DMCAPage() {
  return (
    <div className="pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-6">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-block px-3 py-1 rounded-full bg-spark-amber/10 border border-spark-amber/20 text-spark-amber text-xs font-data uppercase tracking-wider mb-4">
            17 U.S.C. &sect; 512 &middot; Safe Harbor
          </div>
          <h1 className="font-display text-4xl font-bold mb-3 text-white">
            <BlurText text="DMCA Policy" />
          </h1>
          <p className="text-white/70 font-body">
            Effective Date: April 23, 2026 &middot; Last Updated: April 23, 2026
          </p>
        </div>

        <div className="space-y-10 font-body text-white/70 leading-relaxed">
          {/* ═══ Intro ═══ */}
          <section id="intro">
            <p>
              SparkForge respects the intellectual property rights of others and complies with the Digital Millennium
              Copyright Act of 1998 (DMCA), 17 U.S.C. &sect; 512. If you believe content available through SparkForge
              infringes a copyright you own or control, this page explains how to submit a notice that meets the statutory
              requirements, how to file a counter-notice if your content was removed in error, and how we handle repeat
              infringers.
            </p>
            <p className="mt-3 text-sm text-white/70">
              SparkForge is an educational platform that allows users (under parental supervision) to submit short text
              prompts to an AI learning game (Prompt Lab) and receive AI-generated responses. These submissions and
              responses are the principal user-generated content on the platform.
            </p>
          </section>

          {/* ═══ Designated Agent ═══ */}
          <section id="agent">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-spark-blue/10 border border-spark-blue/20 flex items-center justify-center text-spark-blue">
                <ScrollText className="w-5 h-5" strokeWidth={2} aria-hidden="true" />
              </div>
              <h2 className="font-display text-xl font-semibold text-white">
                1. Designated Copyright Agent
              </h2>
            </div>
            <p className="mb-4">
              SparkForge has designated the following agent to receive notifications of claimed copyright infringement
              under 17 U.S.C. &sect; 512(c)(2):
            </p>
            <div className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.08]">
              <p className="text-sm text-white/80">
                <strong className="text-white">Conrad Steinmeyer, Owner</strong><br />
                SparkForge LLC <span className="text-white/70">(an Illinois limited liability company)</span><br />
                Mailing address: <span className="text-white/70">[MAILING ADDRESS &mdash; to be finalized before production launch]</span><br />
                Telephone: <a href="tel:+17736292320" className="text-spark-blue hover:underline">(773) 629-2320</a><br />
                Email: <a href="mailto:admin@sparkforge-labs.com" className="text-spark-blue hover:underline">admin@sparkforge-labs.com</a>
              </p>
              <p className="mt-3 text-xs text-white/70">
                Registration with the U.S. Copyright Office DMCA Directory is required for the safe harbor.
                Verify the current public record at{' '}
                <a href="https://www.copyright.gov/dmca-directory/" target="_blank" rel="noopener noreferrer" className="text-spark-blue hover:underline">
                  copyright.gov/dmca-directory
                </a>.
              </p>
            </div>
          </section>

          {/* ═══ Takedown notice elements ═══ */}
          <section id="takedown">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-spark-amber/10 border border-spark-amber/20 flex items-center justify-center text-spark-amber">
                <AlertTriangle className="w-5 h-5" strokeWidth={2} aria-hidden="true" />
              </div>
              <h2 className="font-display text-xl font-semibold text-white">
                2. How to submit a takedown notice
              </h2>
            </div>
            <p className="mb-3">
              To be effective under 17 U.S.C. &sect; 512(c)(3)(A), your notice must be a written communication delivered
              to the Designated Agent above (email is acceptable) that includes substantially all of the following:
            </p>
            <ol className="list-decimal list-outside space-y-2 text-white/80 ml-6">
              <li>A physical or electronic signature of a person authorized to act on behalf of the owner of the exclusive right that is allegedly infringed.</li>
              <li>Identification of the copyrighted work claimed to have been infringed (or a representative list, if multiple works).</li>
              <li>Identification of the material that is claimed to be infringing or to be the subject of infringing activity, with information reasonably sufficient to permit us to locate it (specific URL, child profile display name, and approximate date/time of submission, where applicable).</li>
              <li>Information reasonably sufficient to permit us to contact the complaining party, including a mailing address, telephone number, and email address.</li>
              <li>A statement that the complaining party has a good-faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.</li>
              <li>A statement that the information in the notification is accurate, and <strong className="text-white">under penalty of perjury</strong>, that the complaining party is authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.</li>
            </ol>
            <p className="mt-3 text-sm text-white/70">
              Notices that do not include all six elements may not be effective and may result in delayed action or no action at all.
              Materially misrepresenting that material is infringing exposes the sender to liability for damages under
              17 U.S.C. &sect; 512(f).
            </p>
          </section>

          {/* ═══ Counter-notice ═══ */}
          <section id="counter">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-spark-purple/10 border border-spark-purple/20 flex items-center justify-center text-spark-purple">
                <Reply className="w-5 h-5" strokeWidth={2} aria-hidden="true" />
              </div>
              <h2 className="font-display text-xl font-semibold text-white">
                3. How to submit a counter-notice
              </h2>
            </div>
            <p className="mb-3">
              If your content was removed or disabled in response to a DMCA notice, you (or the parent of a minor user
              whose content was affected) may submit a counter-notice under 17 U.S.C. &sect; 512(g)(3). An effective
              counter-notice must include:
            </p>
            <ol className="list-decimal list-outside space-y-2 text-white/80 ml-6">
              <li>Your physical or electronic signature.</li>
              <li>Identification of the material that has been removed or to which access has been disabled and the location at which it appeared before removal.</li>
              <li>A statement <strong className="text-white">under penalty of perjury</strong> that you have a good-faith belief that the material was removed or disabled as a result of mistake or misidentification.</li>
              <li>Your name, address, and telephone number, plus a statement that you consent to the jurisdiction of the federal district court for the judicial district in which your address is located (or, if outside the United States, any judicial district in which SparkForge LLC may be found), and that you will accept service of process from the person who provided the original notification or an agent of that person.</li>
            </ol>
            <p className="mt-3 text-sm text-white/70">
              Upon receipt of a compliant counter-notice we will promptly forward it to the original complainant. If the
              complainant does not file a court action seeking a restraining order against the user within 10&ndash;14
              business days, the removed material may be restored.
            </p>
          </section>

          {/* ═══ Repeat infringer policy ═══ */}
          <section id="repeat">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-spark-amber/10 border border-spark-amber/20 flex items-center justify-center text-spark-amber">
                <UserMinus className="w-5 h-5" strokeWidth={2} aria-hidden="true" />
              </div>
              <h2 className="font-display text-xl font-semibold text-white">
                4. Repeat-infringer policy
              </h2>
            </div>
            <p>
              In accordance with 17 U.S.C. &sect; 512(i)(1)(A), SparkForge has adopted and reasonably implements a policy
              of terminating, in appropriate circumstances, parent accounts (and the associated child profiles) of users
              who are repeat infringers. We track the number of valid DMCA notices associated with each parent account. A
              parent account that receives <strong className="text-white">three or more</strong> uncontested takedowns
              within any rolling 12-month period is subject to suspension and, on subsequent notice, permanent termination.
            </p>
          </section>

          {/* ═══ Limitations ═══ */}
          <section id="limits">
            <h2 className="font-display text-xl font-semibold text-white mb-3">
              5. Important context for ed-tech and AI content
            </h2>
            <ul className="list-disc list-inside space-y-2 text-white/80 ml-2">
              <li>
                Prompt Lab outputs are generated by the Anthropic Claude API. SparkForge LLC is the customer of the
                Anthropic API; per Anthropic&apos;s commercial terms, output IP rights pass through to the customer and
                onward to the user that submitted the prompt. Genuine third-party copyright concerns about specific outputs
                should still be reported here so that the affected output can be removed.
              </li>
              <li>
                SparkForge does not host user-uploaded files (no images, videos, or audio uploads). Reported infringement
                will almost always concern text generated through the Prompt Lab.
              </li>
              <li>
                Trademark, defamation, privacy, and right-of-publicity complaints are not DMCA matters. Direct those to{' '}
                <a href="mailto:legal@sparkforge-labs.com" className="text-spark-blue hover:underline">legal@sparkforge-labs.com</a>.
              </li>
            </ul>
          </section>

          {/* ═══ Cross-links ═══ */}
          <section id="links">
            <h2 className="font-display text-xl font-semibold text-white mb-3">
              6. Related policies
            </h2>
            <p className="text-sm text-white/70">
              See our{' '}
              <Link href="/terms" className="text-spark-blue hover:underline">Terms of Service</Link> (intellectual
              property and acceptable use), our{' '}
              <Link href="/privacy" className="text-spark-blue hover:underline">Privacy Policy</Link>, and our{' '}
              <Link href="/privacy/children" className="text-spark-blue hover:underline">children&apos;s privacy notice</Link>.
            </p>
          </section>

          {/* Legal review notice */}
          <div className="mt-12 p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <p className="text-xs text-amber-400/70 font-body">
              <strong className="text-amber-400/90">LEGAL REVIEW REQUIRED:</strong> This DMCA policy has been drafted to
              align with 17 U.S.C. &sect; 512(c)&ndash;(i). The Designated Agent must be registered with the U.S. Copyright
              Office DMCA Directory <em>before</em> SparkForge can rely on the safe harbor; that registration also requires
              a finalized mailing address. This policy should be reviewed by qualified legal counsel before production
              deployment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
