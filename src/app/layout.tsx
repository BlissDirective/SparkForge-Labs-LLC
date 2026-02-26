import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SparkForge — Where Curiosity Meets AI',
  description: 'The gamified AI learning platform for kids ages 7-16. 10 labs, 28 games, endless discovery.',
  openGraph: {
    title: 'SparkForge — Where Curiosity Meets AI',
    description: 'The gamified AI learning platform for kids ages 7-16.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="font-body antialiased bg-surface-base text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
