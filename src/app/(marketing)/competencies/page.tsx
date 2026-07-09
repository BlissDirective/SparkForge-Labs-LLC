import { Metadata } from 'next';
import CompetenciesContent from './CompetenciesContent';

// ════════════════════════════════════════════════════════════════════
// /competencies — G5: UNESCO AI Competency Framework map, published.
// Server component wrapper (exports SEO metadata) + client content
// (motion/react scroll-reveal). Route: /competencies
// ════════════════════════════════════════════════════════════════════

export const metadata: Metadata = {
  title: 'AI Competencies — UNESCO Framework Mapped | SparkForge',
  description:
    'How SparkForge aligns its 11 labs and 47 games to the UNESCO AI Competency Framework for Students — 4 dimensions × 3 progression levels, mapped honestly to real games.',
};

export default function CompetenciesPage() {
  return <CompetenciesContent />;
}
