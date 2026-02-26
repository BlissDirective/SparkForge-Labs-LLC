import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SparkForge — AI Learning Lab',
  description: 'Interactive AI learning platform for young explorers',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="font-body bg-surface-deep text-[var(--text-primary)] antialiased">
        <a href="#main-content" className="skip-to-content">
          Skip to content
        </a>
        <main id="main-content">
          {children}
        </main>
      </body>
    </html>
  );
}
