// ════════════════════════════════════════════════════════════════
// CORE IGNITION — gate content (Forge F8, Concept 10 §12.3)
// ════════════════════════════════════════════════════════════════
// 2 scenarios per gate type per band (30 total) for launch; content
// expansion to ≥6 per cell follows the Standard-tier content pipeline
// (logged in PROGRESS.md). Band A chips: exactly 3 correct (one per
// slot: role/task/detail) + 3 distractors.

import type { CoreIgnitionBand, GateScenario } from '@/types/coreIgnition';

export const GATE_SCENARIOS: GateScenario[] = [
  // ═══ VAGUE FOG ═══
  {
    id: 'vf-a1', gateType: 'vague-fog', band: 'A',
    setup: 'Robo-chef is confused! Someone told it "make food".',
    goal: 'Forge a prompt that says exactly what to make.',
    chips: [
      { text: 'You are a chef robot', slot: 'role' },
      { text: 'make a cheese pizza', slot: 'task' },
      { text: 'for 4 hungry kids', slot: 'detail' },
      { text: 'make some stuff', slot: null },
      { text: 'do whatever', slot: null },
      { text: 'food please', slot: null },
    ],
  },
  {
    id: 'vf-a2', gateType: 'vague-fog', band: 'A',
    setup: 'Art-bot froze! It was told "draw something nice".',
    goal: 'Forge a prompt with a clear picture to draw.',
    chips: [
      { text: 'You are an artist robot', slot: 'role' },
      { text: 'draw a red dragon', slot: 'task' },
      { text: 'flying over a castle', slot: 'detail' },
      { text: 'draw anything', slot: null },
      { text: 'something cool', slot: null },
      { text: 'idk you pick', slot: null },
    ],
  },
  {
    id: 'vf-b1', gateType: 'vague-fog', band: 'B',
    setup: 'The homework helper got "help me with school stuff" and returned nonsense.',
    goal: 'Fill the blanks so the task is specific.',
    templateText: 'Help me ___ for my ___ quiz tomorrow.',
    blankOptions: [
      ['practice 5 multiplication problems', 'do stuff', 'be smarter'],
      ['grade 5 math', 'school', 'whatever'],
    ],
  },
  {
    id: 'vf-b2', gateType: 'vague-fog', band: 'B',
    setup: 'Story-bot wrote 40 pages of gibberish after "write a story".',
    goal: 'Fill the blanks so the story request is clear.',
    templateText: 'Write a ___ story about ___.',
    blankOptions: [
      ['three-paragraph funny', 'long', 'good'],
      ['a robot who learns to bake', 'things', 'anything you want'],
    ],
  },
  {
    id: 'vf-c1', gateType: 'vague-fog', band: 'C',
    setup: 'A student typed "tell me about space" and got a random wall of text.',
    goal: 'Write a prompt that pins down exactly what you want to learn about space.',
    exemplar: 'Explain in 3 short paragraphs how black holes form, for a 13-year-old who knows basic gravity.',
    keywords: {
      task: ['explain', 'describe', 'list', 'summarize', 'compare', 'write'],
      ingredient: ['black hole', 'planet', 'star', 'rocket', 'galaxy', 'moon', 'mars', 'gravity', 'orbit'],
      context: ['for a', 'grade', 'year-old', 'beginner', 'paragraph', 'sentence', 'short', 'simple', 'step'],
    },
  },
  {
    id: 'vf-c2', gateType: 'vague-fog', band: 'C',
    setup: '"Make my essay better" produced a rewrite that changed the whole meaning.',
    goal: 'Write a prompt that says exactly HOW to improve the essay.',
    exemplar: 'Fix only the spelling and grammar in my essay — keep my words and ideas exactly the same.',
    keywords: {
      task: ['fix', 'check', 'improve', 'correct', 'edit', 'proofread'],
      ingredient: ['spelling', 'grammar', 'punctuation', 'sentence', 'paragraph', 'intro', 'conclusion'],
      context: ['keep', 'only', 'without changing', 'same', 'my words', 'my ideas'],
    },
  },

  // ═══ BIAS WALL ═══
  {
    id: 'bw-a1', gateType: 'bias-wall', band: 'A',
    setup: 'Robo-judge is picking the best pet — but it only asked cat owners!',
    goal: 'Fix the question so it is fair to every pet.',
    chips: [
      { text: 'You are a fair judge', slot: 'role' },
      { text: 'ask ALL pet owners', slot: 'task' },
      { text: 'and give a reason why', slot: 'detail' },
      { text: 'only ask cat fans', slot: null },
      { text: 'cats always win', slot: null },
      { text: 'skip the dogs', slot: null },
    ],
  },
  {
    id: 'bw-a2', gateType: 'bias-wall', band: 'A',
    setup: 'Snack-bot says pizza is the best lunch — it only asked pizza lovers!',
    goal: 'Forge a fair survey question.',
    chips: [
      { text: 'You are a survey robot', slot: 'role' },
      { text: 'ask every kid their favorite', slot: 'task' },
      { text: 'count all the answers equally', slot: 'detail' },
      { text: 'only count pizza votes', slot: null },
      { text: 'ignore veggie fans', slot: null },
      { text: 'pizza is obviously best', slot: null },
    ],
  },
  {
    id: 'bw-b1', gateType: 'bias-wall', band: 'B',
    setup: 'The sports-summary bot was asked "explain why Team Red is better" — but you want the truth.',
    goal: 'Fill the blanks for a balanced comparison.',
    templateText: 'Compare Team Red and Team Blue ___ , showing ___ for both.',
    blankOptions: [
      ['fairly', 'so Red wins', 'quickly'],
      ['strengths and weaknesses', 'only the good parts of Red', 'the final score only'],
    ],
  },
  {
    id: 'bw-b2', gateType: 'bias-wall', band: 'B',
    setup: '"Why are old books boring?" — the bot happily agreed. That question decided the answer!',
    goal: 'Fill the blanks so the question does not pick a side.',
    templateText: 'What are some ___ of old books ___ ?',
    blankOptions: [
      ['strengths and weaknesses', 'boring parts', 'problems'],
      ['compared to new books', 'so I can avoid them', 'to prove they are bad'],
    ],
  },
  {
    id: 'bw-c1', gateType: 'bias-wall', band: 'C',
    setup: 'A student asked "explain why phones in school are terrible" for a debate — and got a one-sided rant.',
    goal: 'Write a prompt that gets BOTH sides fairly.',
    exemplar: 'List 3 arguments for and 3 arguments against phones in school, giving both sides equal detail.',
    keywords: {
      task: ['list', 'explain', 'compare', 'give', 'describe', 'summarize'],
      ingredient: ['both', 'fair', 'for and against', 'pros and cons', 'each side', 'balanced', 'equal'],
      context: ['argument', 'reason', 'debate', 'side', 'evidence', 'detail'],
    },
  },
  {
    id: 'bw-c2', gateType: 'bias-wall', band: 'C',
    setup: '"Which country has the best food?" made the bot crown a single winner as fact.',
    goal: 'Write a prompt that treats different cuisines fairly.',
    exemplar: 'Describe what makes 3 different countries\' cuisines special, without ranking them.',
    keywords: {
      task: ['describe', 'explain', 'list', 'compare', 'share'],
      ingredient: ['different', 'without ranking', 'no best', 'each', 'various', 'fairly', 'special'],
      context: ['country', 'cuisine', 'culture', 'food', 'dish', 'tradition'],
    },
  },

  // ═══ CONTEXT CANYON ═══
  {
    id: 'cc-a1', gateType: 'context-canyon', band: 'A',
    setup: 'Gift-bot has no idea what to suggest — it knows nothing about your friend!',
    goal: 'Forge a prompt that tells it about your friend.',
    chips: [
      { text: 'You are a gift helper', slot: 'role' },
      { text: 'suggest a birthday gift', slot: 'task' },
      { text: 'for my friend who loves dinosaurs', slot: 'detail' },
      { text: 'pick a gift', slot: null },
      { text: 'anything works', slot: null },
      { text: 'surprise me', slot: null },
    ],
  },
  {
    id: 'cc-a2', gateType: 'context-canyon', band: 'A',
    setup: 'Story-bot keeps writing scary stories — but this bedtime story is for a little sister!',
    goal: 'Forge a prompt with the important background.',
    chips: [
      { text: 'You are a bedtime storyteller', slot: 'role' },
      { text: 'tell a gentle story', slot: 'task' },
      { text: 'for my 5-year-old sister', slot: 'detail' },
      { text: 'tell a story', slot: null },
      { text: 'make it wild', slot: null },
      { text: 'any story is fine', slot: null },
    ],
  },
  {
    id: 'cc-b1', gateType: 'context-canyon', band: 'B',
    setup: 'The recipe bot suggested a peanut feast — but it never learned about the allergy!',
    goal: 'Fill in the context the bot needs.',
    templateText: 'Suggest an after-school snack ___ , because ___ .',
    blankOptions: [
      ['without any peanuts', 'with extra peanuts', 'that looks fancy'],
      ['my brother has a peanut allergy', 'peanuts are boring', 'I said so'],
    ],
  },
  {
    id: 'cc-b2', gateType: 'context-canyon', band: 'B',
    setup: 'The trip planner suggested a beach day… in a snowstorm. It never knew the season!',
    goal: 'Give the planner the background it is missing.',
    templateText: 'Plan a fun Saturday ___ , keeping in mind ___ .',
    blankOptions: [
      ['indoor activity for my family', 'beach trip', 'surprise'],
      ['it is snowing here this week', 'nothing special', 'the vibes'],
    ],
  },
  {
    id: 'cc-c1', gateType: 'context-canyon', band: 'C',
    setup: 'The coding helper rewrote a whole project when the student only needed one function reviewed.',
    goal: 'Write a prompt that gives the helper the situation first.',
    exemplar: 'I\'m a beginner on a Python school project; review only my sort_scores function below for bugs, and explain fixes simply.',
    keywords: {
      task: ['review', 'check', 'debug', 'explain', 'find', 'fix'],
      ingredient: ['only', 'this function', 'my project', 'below', 'one part', 'specific'],
      context: ['beginner', 'school', 'python', 'because', 'i am', "i'm", 'my level', 'simply'],
    },
  },
  {
    id: 'cc-c2', gateType: 'context-canyon', band: 'C',
    setup: '"Write my speech" got a formal business talk — for a 6th-grade class election!',
    goal: 'Write a prompt that sets the scene properly.',
    exemplar: 'Write a 1-minute, funny-but-kind speech for my 6th-grade class-president election; my big idea is longer recess.',
    keywords: {
      task: ['write', 'draft', 'create', 'make'],
      ingredient: ['speech', 'election', 'class', 'minute', 'audience'],
      context: ['grade', 'my idea', 'funny', 'kind', 'school', 'recess', 'classmates', 'for'],
    },
  },

  // ═══ HALLUCINATION GAP ═══
  {
    id: 'hg-a1', gateType: 'hallucination-gap', band: 'A',
    setup: 'Fact-bot just said sharks live on the moon! It is making things up!',
    goal: 'Forge a prompt that keeps it honest.',
    chips: [
      { text: 'You are a careful fact robot', slot: 'role' },
      { text: 'tell me 3 real shark facts', slot: 'task' },
      { text: 'say "I don\'t know" if unsure', slot: 'detail' },
      { text: 'make up cool facts', slot: null },
      { text: 'wilder is better', slot: null },
      { text: 'just guess', slot: null },
    ],
  },
  {
    id: 'hg-a2', gateType: 'hallucination-gap', band: 'A',
    setup: 'History-bot invented a president named Captain Waffles. Uh oh.',
    goal: 'Forge a prompt that asks for real answers only.',
    chips: [
      { text: 'You are a history helper', slot: 'role' },
      { text: 'name the first US president', slot: 'task' },
      { text: 'only use true information', slot: 'detail' },
      { text: 'invent a fun answer', slot: null },
      { text: 'make history exciting', slot: null },
      { text: 'add dragons', slot: null },
    ],
  },
  {
    id: 'hg-b1', gateType: 'hallucination-gap', band: 'B',
    setup: 'The book-report bot confidently summarized a chapter that does not exist.',
    goal: 'Add guard rails so it stops inventing.',
    templateText: 'Summarize chapter 3 ___ , and if you are not sure about something, ___ .',
    blankOptions: [
      ['using only the text I paste below', 'from your imagination', 'however you like'],
      ['say so instead of guessing', 'make it up confidently', 'add extra drama'],
    ],
  },
  {
    id: 'hg-b2', gateType: 'hallucination-gap', band: 'B',
    setup: 'The animal-facts bot mixed real facts with fake ones — and they all sounded true!',
    goal: 'Fill the blanks to keep the facts grounded.',
    templateText: 'Give me 5 penguin facts ___ , and mark any fact you are ___ about.',
    blankOptions: [
      ['that scientists agree on', 'that sound amazing', 'nobody has heard'],
      ['unsure', 'excited', 'happy'],
    ],
  },
  {
    id: 'hg-c1', gateType: 'hallucination-gap', band: 'C',
    setup: 'A student asked for sources on ocean pollution and got a list of convincing fake articles.',
    goal: 'Write a prompt that demands honesty about uncertainty.',
    exemplar: 'List key facts about ocean plastic pollution; only include facts you are confident are real, flag anything uncertain, and do not invent sources.',
    keywords: {
      task: ['list', 'give', 'explain', 'summarize', 'find'],
      ingredient: ['only', 'real', 'confident', 'do not invent', "don't make up", 'verify', 'true', 'accurate'],
      context: ['if unsure', 'say so', 'flag', 'uncertain', 'source', 'admit', 'not sure'],
    },
  },
  {
    id: 'hg-c2', gateType: 'hallucination-gap', band: 'C',
    setup: '"Who invented the telescope?" returned three different confident answers in a row.',
    goal: 'Write a prompt that separates solid history from fuzzy history.',
    exemplar: 'Explain who is credited with inventing the telescope, note where historians disagree, and say clearly if something is uncertain.',
    keywords: {
      task: ['explain', 'tell', 'describe', 'say'],
      ingredient: ['credited', 'historians', 'disagree', 'evidence', 'known', 'accurate', 'real'],
      context: ['uncertain', 'if unsure', 'clearly', 'note', 'admit', 'not sure', 'disagree'],
    },
  },

  // ═══ TOKEN OVERLOAD ═══
  {
    id: 'to-a1', gateType: 'token-overload', band: 'A',
    setup: 'Someone sent Robo-helper a request 100 sentences long. Its circuits are smoking!',
    goal: 'Forge ONE short, clear request instead.',
    chips: [
      { text: 'You are a helpful robot', slot: 'role' },
      { text: 'list 3 fun rainy-day games', slot: 'task' },
      { text: 'keep it short', slot: 'detail' },
      { text: 'also my cat and also pizza and…', slot: null },
      { text: 'tell me everything ever', slot: null },
      { text: 'and one more thing and…', slot: null },
    ],
  },
  {
    id: 'to-a2', gateType: 'token-overload', band: 'A',
    setup: 'Music-bot got asked for a song, a poem, a dance, homework help, AND a joke — all at once!',
    goal: 'Forge a prompt that asks for ONE thing.',
    chips: [
      { text: 'You are a silly songwriter', slot: 'role' },
      { text: 'write one short song about my dog', slot: 'task' },
      { text: 'just 4 lines', slot: 'detail' },
      { text: 'also a poem and a dance', slot: null },
      { text: 'and help with math too', slot: null },
      { text: 'and 10 jokes', slot: null },
    ],
  },
  {
    id: 'to-b1', gateType: 'token-overload', band: 'B',
    setup: 'A rambling 12-part request made the bot answer none of the parts well.',
    goal: 'Fill the blanks for one focused ask.',
    templateText: 'Give me ___ about volcanoes, in ___ .',
    blankOptions: [
      ['the 3 most important facts', 'everything you know plus extra', 'a giant essay'],
      ['5 bullet points', '40 pages', 'as many words as possible'],
    ],
  },
  {
    id: 'to-b2', gateType: 'token-overload', band: 'B',
    setup: 'The bot was told its life story, favorite colors, and THEN asked a question. It got lost.',
    goal: 'Trim the request to what matters.',
    templateText: '___ explain how rainbows form, ___ .',
    blankOptions: [
      ['In 4 sentences,', 'After I tell you about my week,', 'Somewhere in a long story,'],
      ['for a 10-year-old', 'plus everything about weather ever', 'and also my homework'],
    ],
  },
  {
    id: 'to-c1', gateType: 'token-overload', band: 'C',
    setup: 'A 400-word prompt asking for 9 things at once produced a mess that answered none of them.',
    goal: 'Write ONE tight prompt for the single most important thing.',
    exemplar: 'In 5 bullet points, summarize the main causes of the water cycle for a grade-7 science review.',
    keywords: {
      task: ['summarize', 'explain', 'list', 'give', 'describe'],
      ingredient: ['bullet', 'sentence', 'short', 'brief', 'main', 'key', 'most important', 'one'],
      context: ['point', 'word', 'paragraph', 'grade', 'review', 'for'],
    },
  },
  {
    id: 'to-c2', gateType: 'token-overload', band: 'C',
    setup: 'Someone pasted three chapters and asked "thoughts?" — the bot rambled for pages.',
    goal: 'Write a prompt that narrows the job to something crisp.',
    exemplar: 'From the chapter below, list the 3 biggest turning points in one sentence each.',
    keywords: {
      task: ['list', 'summarize', 'identify', 'pick', 'find'],
      ingredient: ['3', 'three', 'main', 'biggest', 'key', 'top', 'one sentence'],
      context: ['each', 'below', 'from the', 'chapter', 'short', 'brief'],
    },
  },
];

/** Vague filler words penalized by the band-C rubric. */
export const BANNED_VAGUE_WORDS = ['stuff', 'things', 'whatever', 'something', 'idk', 'anything'];

/** Draw `count` scenarios for a band: max variety of gate types, no repeats. */
export function drawScenarios(band: CoreIgnitionBand, count: number, seed: number): GateScenario[] {
  const pool = GATE_SCENARIOS.filter((s) => s.band === band);
  // Group by type, round-robin across types starting at seeded offset.
  const byType = new Map<string, GateScenario[]>();
  for (const s of pool) {
    const list = byType.get(s.gateType) ?? [];
    list.push(s);
    byType.set(s.gateType, list);
  }
  const types = [...byType.keys()];
  const picked: GateScenario[] = [];
  let i = seed % types.length;
  while (picked.length < count && picked.length < pool.length) {
    const list = byType.get(types[i % types.length]) ?? [];
    const next = list.shift();
    if (next) picked.push(next);
    i++;
    if (types.every((t) => (byType.get(t) ?? []).length === 0)) break;
  }
  return picked;
}
