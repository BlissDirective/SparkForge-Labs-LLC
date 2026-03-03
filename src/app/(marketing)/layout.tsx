import { Metadata } from 'next';

// Marketing Layout — Public pages (landing, pricing, etc.)

export const metadata: Metadata = {
  title: 'SparkForge — AI Learning Lab for Kids',
  description:
    'A gamified AI learning platform for children ages 7-16. 10 labs, 35+ games, built for curious minds.',
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
