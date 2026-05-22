// ════════════════════════════════════════════════════════════════════════
// DATA SHIELD v3 — Lab 5 — Redesigned
// ════════════════════════════════════════════════════════════════════════
// Protect data privacy! Learn about encryption, anonymization, GDPR.
// Quiz format with privacy scenarios.

'use client';
import { useCallback } from 'react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import GameLevelSystem, { type LevelResult } from '@/components/games/shared/GameLevelSystem';
import QuizLevelRenderer, { type QuizQuestion } from '@/components/games/shared/QuizLevelRenderer';

const LEVELS = [
  { id: 1, name: 'Password Power', description: 'Build strong passwords!', emoji: '🔐', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 50 },
  { id: 2, name: 'Personal Info', description: 'What data is private?', emoji: '📋', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 60 },
  { id: 3, name: 'Encryption 101', description: 'Secret codes for data!', emoji: '🔒', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 70 },
  { id: 4, name: 'Sharing Smart', description: 'When is sharing data OK?', emoji: '🤝', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 80 },
  { id: 5, name: 'AI & Privacy', description: 'How AI uses your data.', emoji: '🧠', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 90 },
  { id: 6, name: 'Deepfake Danger', description: 'When AI fakes your identity.', emoji: '⚠️', difficulty: 'medium' as const, starThresholds: [50,75,90], xpReward: 100 },
  { id: 7, name: 'GDPR Rights', description: 'Your data protection rights.', emoji: '⚖️', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 120 },
  { id: 8, name: 'Anonymization', description: 'Hiding identity in data.', emoji: '🎭', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 130 },
  { id: 9, name: 'Consent Complex', description: 'Understanding data consent.', emoji: '✅', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 150 },
  { id: 10, name: 'Privacy Master', description: 'The ultimate data protector!', emoji: '🛡️', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 200, isBonus: true },
];

function getQuestions(levelId: number): QuizQuestion[] {
  const all: QuizQuestion[] = [
    { question: "Which password is strongest?", options: ["MyDog2024!","password123","qwerty","abc"], correctIndex: 0, explanation: "Strong passwords use uppercase, lowercase, numbers, and symbols. 'MyDog2024!' mixes all four.", band: 'A' },
    { question: "Should you use the same password for every website?", options: ["No — if one site is hacked, all are at risk","Yes — it's easier to remember","Only for important sites","Only if it's a strong password"], correctIndex: 0, explanation: "Credential stuffing attacks try leaked passwords on other sites. Unique passwords for each site protect you.", band: 'A' },
    { question: "What does 'encryption' do?", options: ["Scrambles data so only authorized people can read it","Deletes data","Makes data public","Compresses files"], correctIndex: 0, explanation: "Encryption converts readable data into coded form. Only someone with the key can decrypt and read it.", band: 'A' },
    { question: "Is your home address considered 'personally identifiable information' (PII)?", options: ["Yes — it can identify you","No — everyone has an address","Only with your name","Only in some countries"], correctIndex: 0, explanation: "PII is any data that can identify a specific person. Addresses, phone numbers, and emails are all PII.", band: 'A' },
    { question: "Two-factor authentication (2FA) means...", options: ["Two different ways to prove it's you","Two passwords","Two email addresses","Two devices"], correctIndex: 0, explanation: "2FA requires something you know (password) + something you have (phone/app) or something you are (fingerprint).", band: 'B' },
    { question: "A website asks for your exact birthday to 'verify your age.' Should you give it?", options: ["Only if you trust the site and it's necessary","Always — everyone does","Never — lie about your age","Only the year"], correctIndex: 0, explanation: "Be selective. Exact birthdates are valuable to identity thieves. Many sites only need your age range.", band: 'B' },
    { question: "AI facial recognition in public spaces raises privacy concerns because...", options: ["It can track people without consent","It's too slow","It only works on adults","It makes photos blurry"], correctIndex: 0, explanation: "Mass facial recognition can track movements and associations without people's knowledge or consent.", band: 'C' },
    { question: "'Anonymization' of data means...", options: ["Removing info that identifies individuals","Deleting all data","Making data public","Encrypting data"], correctIndex: 0, explanation: "Anonymization strips PII so individuals can't be identified. It's different from encryption (which is reversible).", band: 'B' },
    { question: "GDPR (General Data Protection Regulation) gives people the right to...", options: ["Ask companies to delete their personal data","Use any app for free","Avoid all tracking","Never see ads"], correctIndex: 0, explanation: "GDPR grants 'right to erasure' (be forgotten), data portability, and consent requirements for EU citizens.", band: 'C' },
    { question: "A 'deepfake' of your face could be used to...", options: ["All of these","Impersonate you in videos","Bypass facial recognition security","Trick your friends and family"], correctIndex: 0, explanation: "Deepfakes can impersonate people, commit fraud, spread misinformation, and bypass biometric security.", band: 'C' },
    { question: "When a free app says 'We sell anonymized data,' this means...", options: ["Data with identifiers removed (but re-identification is sometimes possible)","Data is completely safe","They don't sell anything","The data is encrypted"], correctIndex: 0, explanation: "'Anonymized' doesn't always mean safe. Researchers have re-identified people from supposedly anonymized datasets.", band: 'C' },
    { question: "COPPA (Children's Online Privacy Protection Act) protects...", options: ["Kids under 13 in the US","All internet users","Only EU citizens","Adults only"], correctIndex: 0, explanation: "COPPA requires parental consent before collecting data from children under 13. SparkForge is COPPA-compliant!", band: 'B' },
  ];

  const perLevel = 8;
  const start = (levelId - 1) * 2;
  const levelQs: QuizQuestion[] = [];
  for (let i = 0; i < perLevel; i++) {
    const idx = (start + i) % all.length;
    levelQs.push(all[idx]);
  }
  return levelQs;
}

export default function DataShieldGame() {
  const { awardXP, completeGame } = useGameActions();
  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('data-shield', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Data Shield" color="#2ECC71" labNum={5}>
      <GameLevelSystem gameTitle="Data Shield" gameEmoji="🛡️" labColor="#2ECC71" levels={LEVELS}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <QuizLevelRenderer level={level} onComplete={onComplete} onExit={onExit}
            questions={getQuestions(level.id)} labColor="#2ECC71" gameEmoji="🛡️" timePerQuestion={18} />
        )}
      />
    </GameShell>
  );
}
