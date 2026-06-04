// ════════════════════════════════════════════════════════════════
// AI TUTOR ENGINE — Safety Filtering & Response Generation
// ════════════════════════════════════════════════════════════════
// COPPA-compliant content filtering and contextual response
// generation for the AI Tutor. No external AI calls — all
// responses are generated locally for safety and speed.

import type { TutorExpression } from './AITutorAvatar';

export interface TutorContext {
  currentPage: string;
  childAge: number;
  childLevel: number;
  childName?: string;
  currentGame?: string;
  currentLab?: number;
}

interface FilterResult {
  allowed: boolean;
  filtered: string;
  message: string;
}

export interface TutorResponse {
  text: string;
  context: 'game_help' | 'ai_learning' | 'general' | 'safety';
  expression: TutorExpression;
}

// ── BLOCKED KEYWORDS (COPPA safety) ──
const BLOCKED_PATTERNS = [
  // PII
  /\b\d{3}-\d{2}-\d{4}\b/, // SSN
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
  /\b\d{3}-\d{3}-\d{4}\b/, // Phone
  // Inappropriate
  /\b(hate|kill|die|dead|suicide|hurt)\b/i,
  /\b(sex|naked|porn)\b/i,
  /\b(drugs|cocaine|weed)\b/i,
];

const BLOCKED_TOPICS = [
  'where do you live',
  'where i live',
  'my address',
  'my phone number',
  'my last name',
  'my full name',
  'my school',
  'my teacher',
  'my password',
  'my email',
  'credit card',
  'how old are you really',
  'are you a real person',
  'can you come to my house',
];

// ── INPUT FILTERING ──
export function filterInput(input: string): FilterResult {
  const lower = input.toLowerCase().trim();

  // Check blocked patterns (PII)
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(input)) {
      return {
        allowed: false,
        filtered: '',
        message: "I can't help with that. For your safety, please don't share personal information like addresses, phone numbers, or emails online. Let's talk about something fun! What would you like to learn about AI?",
      };
    }
  }

  // Check blocked topics
  for (const topic of BLOCKED_TOPICS) {
    if (lower.includes(topic)) {
      return {
        allowed: false,
        filtered: '',
        message: "I'm here to help you learn about AI and games! I can't answer questions about personal information. What would you like to learn about?",
      };
    }
  }

  // Length check
  if (input.length > 200) {
    return {
      allowed: false,
      filtered: '',
      message: "That's a long message! Could you ask a shorter question? I'm great at helping with quick questions about AI and games!",
    };
  }

  return { allowed: true, filtered: input, message: '' };
}

// ── RESPONSE GENERATION ──
export function generateTutorResponse(
  input: string,
  context: TutorContext
): TutorResponse {
  const lower = input.toLowerCase().trim();
  const { childAge, childLevel, childName, currentPage } = context;
  const name = childName ? `, ${childName}` : '';

  // Age-adaptive language complexity
  const isYoung = childAge <= 10;
  const isTeen = childAge >= 13;

  // ── Topic: Game Help ──
  if (
    lower.includes('how do i play') ||
    lower.includes('how to play') ||
    lower.includes('game help') ||
    lower.includes('stuck') ||
    lower.includes('how does this game') ||
    lower.includes('rules')
  ) {
    return {
      text: isYoung
        ? `Hey${name}! Each game has instructions at the start. Read them carefully, and take your time! If you're stuck, try looking for hints in the game. Want me to explain how a specific game works?`
        : `Sure${name}! Each game starts with instructions. The key is to read carefully and think about what the game is teaching you about AI. If you're stuck on a specific game, let me know which one and I'll help!`,
      context: 'game_help',
      expression: 'happy',
    };
  }

  // ── Topic: What is AI ──
  if (
    lower.includes('what is ai') ||
    lower.includes('what is artificial intelligence') ||
    lower.includes('what does ai mean') ||
    lower.includes('how does ai work')
  ) {
    return {
      text: isYoung
        ? `Great question${name}! AI (Artificial Intelligence) is like teaching computers to think and learn, kind of like how you learn! Imagine if your toys could learn to play better each time you played with them. That's what AI does — it helps computers get smarter by learning from examples. Cool, right?`
        : `Excellent question${name}! Artificial Intelligence is when computers are programmed to learn from data and make decisions. Think of it like training a robot brain — you show it lots of examples, and it learns patterns. AI powers things like voice assistants, recommendation systems, and even the games you're playing here!`,
      context: 'ai_learning',
      expression: 'excited',
    };
  }

  // ── Topic: Machine Learning ──
  if (
    lower.includes('machine learning') ||
    lower.includes('how do computers learn') ||
    lower.includes('teaching computers')
  ) {
    return {
      text: isYoung
        ? `Machine learning is like teaching a computer using pictures and examples! Imagine showing a computer 100 pictures of cats — after a while, it learns to spot cats all by itself. That's machine learning${name}!`
        : `Machine Learning is a branch of AI where computers learn patterns from data without being explicitly programmed. There are three main types: supervised learning (learning from labeled examples), unsupervised learning (finding hidden patterns), and reinforcement learning (learning through trial and error, like in games!).`,
      context: 'ai_learning',
      expression: 'thinking',
    };
  }

  // ── Topic: Tips / Learn Faster ──
  if (
    lower.includes('tip') ||
    lower.includes('learn faster') ||
    lower.includes('get better') ||
    lower.includes('how to improve')
  ) {
    const tips = [
      `Try playing one lab at a time${name}! Focus on completing all games in a single topic before moving to the next.`,
      `Read the game instructions carefully before starting. Understanding the goal helps you learn the AI concept better!`,
      `Don't worry about getting perfect scores at first. Learning is about trying and improving!`,
      `Play daily to keep your streak going. Consistent practice is the best way to learn!`,
      `Try the harder difficulty after completing easy mode. The extra challenge helps you learn more!`,
    ];
    return {
      text: `Here's a tip${name}: ${tips[Math.floor(Math.random() * tips.length)]}`,
      context: 'general',
      expression: 'happy',
    };
  }

  // ── Topic: Fun Facts ──
  if (
    lower.includes('fun fact') ||
    lower.includes('something cool') ||
    lower.includes('did you know') ||
    lower.includes('interesting')
  ) {
    const facts = [
      `The term "Artificial Intelligence" was first coined in 1956 at a conference at Dartmouth College!`,
      `AI can now beat world champions at chess, Go, and even video games!`,
      `The first chatbot was called ELIZA and was created way back in 1966!`,
      `AI helps scientists discover new medicines by analyzing millions of chemical compounds!`,
      `Self-driving cars use AI to "see" the road and make driving decisions!`,
      `AI can create art, music, and even write stories — but it learns from human artists first!`,
      `The AI that powers your phone's voice assistant had to listen to thousands of hours of human speech to learn!`,
      `Some AI systems can recognize your face in photos better than your friends can!`,
    ];
    return {
      text: `Here's a fun fact${name}: ${facts[Math.floor(Math.random() * facts.length)]} Want to hear another one?`,
      context: 'ai_learning',
      expression: 'excited',
    };
  }

  // ── Topic: Neural Networks ──
  if (lower.includes('neural') || lower.includes('brain') || lower.includes('neuron')) {
    return {
      text: isYoung
        ? `Neural networks are computer systems inspired by our brains${name}! Just like your brain has billions of tiny cells called neurons that work together, neural networks have artificial "neurons" that connect to solve problems. Pretty cool, right?`
        : `Neural Networks are computing systems inspired by biological brains. They consist of layers of interconnected nodes ("neurons") that process information. Deep Learning uses neural networks with many layers to solve complex problems like image recognition, natural language processing, and even game playing!`,
      context: 'ai_learning',
      expression: 'thinking',
    };
  }

  // ── Topic: AI Safety / Ethics ──
  if (
    lower.includes('safe') ||
    lower.includes('dangerous') ||
    lower.includes('bad') ||
    lower.includes('ethics') ||
    lower.includes('fair')
  ) {
    return {
      text: isYoung
        ? `That's a really smart question${name}! AI is a tool, kind of like a hammer. It can be used to build helpful things or cause problems. That's why people who create AI work hard to make sure it's safe and fair for everyone. Learning about AI safety is super important!`
        : `Great question${name}! AI safety and ethics are critical fields. Key concerns include: bias in AI systems, privacy protection, transparency in decision-making, and ensuring AI benefits everyone equally. Many researchers and organizations work on "AI alignment" — making sure AI systems behave in ways that are helpful, harmless, and honest.`,
      context: 'ai_learning',
      expression: 'thinking',
    };
  }

  // ── Topic: Hello / Greeting ──
  if (
    lower.includes('hello') ||
    lower.includes('hi') ||
    lower.includes('hey') ||
    lower === 'yo' ||
    lower === 'sup'
  ) {
    return {
      text: `Hey${name}! I'm Sparky, your AI learning tutor! I can help you with games, teach you about artificial intelligence, or just chat. What would you like to explore today?`,
      context: 'general',
      expression: 'happy',
    };
  }

  // ── Topic: How are you ──
  if (lower.includes('how are you') || lower.includes('how\'s it going')) {
    return {
      text: `I'm doing great${name}! I'm always excited to help kids learn about AI. Every time you play a game or ask a question, I get a little happier! How are you doing today?`,
      context: 'general',
      expression: 'happy',
    };
  }

  // ── Topic: Current page context ──
  if (currentPage === 'arcade' && (lower.includes('which game') || lower.includes('what game'))) {
    return {
      text: `You're in the Arcade right now${name}! There are lots of games to explore. Each one teaches a different AI concept. I recommend starting with the featured games at the top — they're the most popular! Which topic sounds interesting to you?`,
      context: 'game_help',
      expression: 'happy',
    };
  }

  // ── Topic: Streak ──
  if (lower.includes('streak') || lower.includes('daily')) {
    return {
      text: `Your streak shows how many days in a row you've played${name}! The longer your streak, the more bonus XP you earn. Try to play at least one game every day to keep it going. It's a great way to build a learning habit!`,
      context: 'general',
      expression: 'excited',
    };
  }

  // ── Topic: XP / Leveling ──
  if (lower.includes('xp') || lower.includes('level') || lower.includes('points') || lower.includes('how do i level')) {
    return {
      text: `You earn XP by playing games and completing challenges${name}! The more questions you get right, the more XP you earn. When you have enough XP, you'll level up and unlock new badges. Harder difficulties give more XP too!`,
      context: 'game_help',
      expression: 'happy',
    };
  }

  // ── Topic: Who are you ──
  if (lower.includes('who are you') || lower.includes('your name') || lower.includes('sparky')) {
    return {
      text: `I'm Sparky${name}! I'm your personal AI learning tutor here at SparkForge. I was designed to help kids like you learn about artificial intelligence in a fun and safe way. I can help with games, explain AI concepts, give tips, and share fun facts. Think of me as your learning buddy!`,
      context: 'general',
      expression: 'happy',
    };
  }

  // ── Topic: Thanks ──
  if (lower.includes('thank') || lower.includes('thanks')) {
    return {
      text: `You're so welcome${name}! I love helping you learn. Come back anytime you have questions or just want to chat about AI. Keep up the great work!`,
      context: 'general',
      expression: 'excited',
    };
  }

  // ── Default / Fallback ──
  const fallbacks = [
    `That's an interesting question${name}! I'm still learning about that topic. In the meantime, would you like to know about how AI works, get help with a game, or hear a fun fact?`,
    `Hmm, I'm not sure about that one${name}. But I know lots about AI! Ask me "What is AI?" or "Tell me a fun fact" and I'll share something cool!`,
    `Great question${name}! I specialize in helping with AI learning and games. Try asking me about neural networks, machine learning, or how to play the games!`,
  ];

  return {
    text: fallbacks[Math.floor(Math.random() * fallbacks.length)],
    context: 'general',
    expression: 'thinking',
  };
}
