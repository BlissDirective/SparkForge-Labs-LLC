// ════════════════════════════════════════════════════════════════
// FORGESPARK VOICE — Forge F7 (Concept 10 §11.5)
// ════════════════════════════════════════════════════════════════
// Kid-safe copy strings for the mascot across tutor/celebration
// surfaces. Tone rules: curious, encouraging, slightly mischievous.
// NEVER sarcasm about a wrong answer, NEVER time pressure in
// encourage lines. Pick randomly per context.

export const FORGE_SPARK_VOICE = {
  greeting: [
    "Fire's hot — what are we forging today?",
    'Welcome back to the forge! I kept your spot warm.',
    'The anvil missed you. Ready to make something?',
  ],
  win: [
    "CLANG! That one's a keeper!",
    'Forged it! Nice and solid.',
    'That answer rang true — great strike!',
  ],
  bigWin: [
    'Three strikes, pure gold! ⚒️',
    'MASTERWORK! The whole forge is glowing!',
    'You tempered that one perfectly. Legendary.',
  ],
  miss: [
    'Cooled off? Heat it up and strike again.',
    'Every smith bends a few nails. Another go!',
    'Hmm, not quite — the metal remembers. Try once more.',
  ],
  hint: [
    'Psst — check the pattern before you pour.',
    'A good smith measures twice. Look again at the clues.',
    'Want a spark? Think about what the machine has seen before.',
  ],
  idleNudge: [
    'The forge is humming…',
    "I've got embers to spare whenever you're ready.",
    'That anvil is looking awfully strikeable.',
  ],
} as const;

export type ForgeSparkVoiceContext = keyof typeof FORGE_SPARK_VOICE;

/** Random line for a context (stable fallback to the first line). */
export function forgeSparkLine(context: ForgeSparkVoiceContext): string {
  const lines = FORGE_SPARK_VOICE[context];
  return lines[Math.floor(Math.random() * lines.length)] ?? lines[0];
}
