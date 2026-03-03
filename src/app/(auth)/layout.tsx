import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-deep bg-cosmic-dark flex flex-col items-center justify-center px-4 py-8">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-spark-purple to-spark-blue flex items-center justify-center">
          <span className="text-2xl">⚡</span>
        </div>
        <span className="font-display text-2xl font-bold text-white">SparkForge</span>
      </Link>

      {/* Card container */}
      <div className="w-full max-w-md">
        {children}
      </div>

      {/* Footer */}
      <p className="mt-8 text-white/20 text-xs font-body text-center">
        © 2026 BlissDirective · SparkForge
      </p>
    </div>
  );
}
