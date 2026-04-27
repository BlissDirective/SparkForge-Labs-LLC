import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

// COPPA-PRD-B (C1 reconciliation): canonical age bands aligned to
// CLAUDE.md and the public marketing/legal copy (pricing FAQ,
// /coppa-notice, /terms, signup R3/S3 cards). Bands:
//   A = Explorer    (ages 7-9, under 13 → full COPPA protections)
//   B = Adventurer  (ages 10-12, under 13 → full COPPA protections)
//   C = Innovator   (ages 13-16, COPPA does not require consent at 13+)
// The legal under-13 cutoff falls cleanly between B and C, which
// matters when the age band drives consent flow choice.
export function getAgeBandLabel(band: 'A' | 'B' | 'C'): string {
  const labels = { A: 'Ages 7-9', B: 'Ages 10-12', C: 'Ages 13-16' };
  return labels[band];
}

export function ageToAgeBand(age: number): 'A' | 'B' | 'C' {
  if (age <= 9) return 'A';
  if (age <= 12) return 'B';
  return 'C';
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
