import { Inter, Nunito } from 'next/font/google';
import '@/styles/design-tokens.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito', display: 'swap' });

export const metadata = { title: 'SparkForge' };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${nunito.variable}`}>
      <body className="antialiased min-h-screen" data-surface="dark" style={{ fontFamily: 'var(--font-body)', backgroundColor: '#0F1123' }}>
        {children}
      </body>
    </html>
  );
}
