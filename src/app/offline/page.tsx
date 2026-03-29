// ════════════════════════════════════════════════════
// OFFLINE PAGE — Frost-Prismatic styled fallback
// S10-HIGH-005: Branded offline experience instead of browser error
// ════════════════════════════════════════════════════

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-surface-deep flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6 font-display font-bold text-neon-blue/20">
          &#x1F4E1;
        </div>
        <h1 className="font-display text-2xl font-bold text-white mb-3">
          You&apos;re Offline
        </h1>
        <p className="font-body text-white/50 text-sm mb-4">
          It looks like your connection dropped. SparkForge needs the internet
          to load labs and sync your progress.
        </p>
        <p className="font-body text-white/30 text-xs mb-8">
          Check your Wi-Fi or cellular connection and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-spark-blue to-blue-600 text-white font-display font-bold text-sm hover:brightness-110 transition-all"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
