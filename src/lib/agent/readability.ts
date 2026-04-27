// ════════════════════════════════════════════════════
// READABILITY — Flesch-Kincaid grade-level scoring
// Used by the safety screening stage to validate
// age-band appropriateness algorithmically.
// ════════════════════════════════════════════════════

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;

  // Remove common silent suffixes
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');

  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? Math.max(matches.length, 1) : 1;
}

function countSentences(text: string): number {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  return Math.max(sentences.length, 1);
}

function countWords(text: string): number {
  return text
    .split(/\s+/)
    .filter((w) => w.replace(/[^a-zA-Z]/g, '').length > 0).length;
}

/**
 * Compute Flesch-Kincaid Grade Level.
 * Returns approximate US school grade level needed to understand the text.
 * Band A (7-9) → max grade 5, Band B (10-12) → max grade 8, Band C (13-16) → max grade 10.
 */
export function fleschKincaidGrade(text: string): number {
  const words = countWords(text);
  if (words === 0) return 0;

  const sentences = countSentences(text);
  const syllables = text
    .split(/\s+/)
    .reduce((sum, w) => sum + countSyllables(w), 0);

  return 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;
}

/**
 * Compute Flesch Reading Ease score.
 * 90-100 = very easy (grade 5), 60-70 = standard (grade 8-9), 30-50 = difficult (college).
 */
export function fleschReadingEase(text: string): number {
  const words = countWords(text);
  if (words === 0) return 100;

  const sentences = countSentences(text);
  const syllables = text
    .split(/\s+/)
    .reduce((sum, w) => sum + countSyllables(w), 0);

  return 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
}

/** Max Flesch-Kincaid grade level per age band */
const MAX_GRADE: Record<string, number> = { A: 5, B: 8, C: 10 };

/**
 * Check if content is readable for the target age band.
 * Returns { valid, grade, maxGrade } for logging.
 */
export function validateReadability(
  text: string,
  ageBand: 'A' | 'B' | 'C'
): { valid: boolean; grade: number; maxGrade: number } {
  const grade = Math.round(fleschKincaidGrade(text) * 10) / 10;
  const maxGrade = MAX_GRADE[ageBand];
  return { valid: grade <= maxGrade, grade, maxGrade };
}
