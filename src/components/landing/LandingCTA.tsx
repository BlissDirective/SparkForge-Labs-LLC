'use client';

import { motion } from 'motion/react';
import { LogIn, Sparkles, ArrowRight } from 'lucide-react';

// Unified dark background for the entire landing page
const BG_DARK = '#0A0F1E';
const TEXT_HEADING = '#F0F2F8';
const TEXT_MUTED = 'rgba(200, 210, 235, 0.55)';

// DecryptedText component (inline for self-containment)
function DecryptedText({ text, className = '' }: { text: string; className?: string }) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*';
  return (
    <span
      className={`inline-block cursor-default ${className}`}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        const original = text;
        let iterations = 0;
        const interval = setInterval(() => {
          el.textContent = original
            .split('')
            .map((char, i) => {
              if (char === ' ') return ' ';
              if (i < iterations) return original[i];
              return chars[Math.floor(Math.random() * chars.length)];
            })
            .join('');
          iterations += 1 / 2;
          if (iterations >= original.length) clearInterval(interval);
        }, 30);
      }}
    >
      {text}
    </span>
  );
}

export function LandingCTA() {
  return (
    <section className="relative py-20 sm:py-24 px-4 overflow-hidden" style={{ backgroundColor: BG_DARK }}>
      {/* Subtle violet gradient blobs */}
      <div
        className="absolute top-0 left-0 w-[500px] h-[300px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, #E945F525, transparent 70%)' }}
      />
      <div
        className="absolute bottom-0 right-0 w-[400px] h-[250px] rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, #4F6EF720, transparent 70%)' }}
      />
      {/* Bottom gradient fade into footer area */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, transparent, rgba(10, 15, 30, 0.5))' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '0px 0px 25% 0px' }}
        transition={{ duration: 0.7 }}
        className="max-w-4xl mx-auto text-center relative"
      >
        {/* Badge */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, margin: '0px 0px 25% 0px' }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
          style={{ backgroundColor: 'rgba(233,69,245,0.08)', border: '1px solid rgba(233,69,245,0.15)' }}
        >
          <Sparkles className="w-4 h-4" style={{ color: '#E945F5' }} />
          <span className="text-sm font-semibold" style={{ color: '#E945F5' }}>New Experience</span>
        </motion.div>

        {/* Main Quote with DecryptedText effect */}
        <h2
          className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-5 leading-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <span className="block mb-2" style={{ color: TEXT_HEADING }}>
            <DecryptedText
              text="Ready to explore the new"
              className="decrypted-text"
            />
          </span>
          <span className="block" style={{ color: '#4DE9FF' }}>
            <DecryptedText
              text="Agentic AI Lab and Games?"
              className="decrypted-text"
            />
          </span>
        </h2>

        <p className="text-base sm:text-lg mb-8 max-w-xl mx-auto" style={{ color: TEXT_MUTED }}>
          Create a free account to unlock the full SparkForge experience — your personal AI
          tutor, 42 games, learning labs, progress tracking, and rewards.
        </p>

        {/* CTA Buttons — new visitors first (P1-10): signup is the
            primary action; returning users get the secondary link. */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/signup"
            className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-full font-semibold text-white text-base transition-all hover:scale-[1.03] active:scale-[0.97]"
            style={{
              background: 'linear-gradient(135deg, #E945F5, #4F6EF7)',
              boxShadow: '0 4px 24px rgba(233,69,245,0.3)',
            }}
          >
            <Sparkles className="w-5 h-5" />
            Create Free Account
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </a>

          <a
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-base transition-all hover:bg-white/5"
            style={{ color: '#A0B0FF', border: '2px solid rgba(160, 176, 255, 0.3)' }}
          >
            <LogIn className="w-5 h-5" />
            Sign In
          </a>
        </div>

        {/* Trust line */}
        <p className="text-xs mt-6" style={{ color: TEXT_MUTED }}>
          No credit card required &middot; COPPA compliant &middot; Free to start
        </p>
      </motion.div>

      <style>{`
        .decrypted-text {
          font-family: var(--font-display);
          letter-spacing: 0.01em;
        }
        .decrypted-text:hover {
          color: inherit;
        }
      `}</style>
    </section>
  );
}
