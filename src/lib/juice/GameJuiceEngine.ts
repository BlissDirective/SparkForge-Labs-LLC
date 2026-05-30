// ════════════════════════════════════════════════════════════════
// GAME JUICE ENGINE — In-Game Feedback System
// ════════════════════════════════════════════════════════════════
// Tracks combos, streaks, milestones, and triggers juice events
// during gameplay. Pure functions — no side effects.
//
// Builds on existing: XPPopup, GameCompleteCelebration, ConfettiEngine
// Adds: Combo chains, milestone popups, Sparky reactions, screen shake

// ═══ TYPES ═══

export type JuiceEventType =
  | 'combo_start'     // First correct in a chain
  | 'combo_build'     // Each additional correct (2+, 3+, etc.)
  | 'combo_break'     // Wrong answer breaks combo
  | 'combo_milestone' // 5, 10, 15, 20 in a row
  | 'correct'         // Individual correct answer
  | 'wrong'           // Individual wrong answer
  | 'perfect_round'   // 100% accuracy on a round
  | 'speed_demon'     // Answered very fast
  | 'comeback'        // Correct after 2+ wrongs
  | 'hint_used'       // Used a hint
  | 'level_complete'  // All rounds done
  | 'personal_best';  // New high score

export interface JuiceEvent {
  type: JuiceEventType;
  combo: number;       // Current combo count
  maxCombo: number;    // Session max combo
  round: number;       // Current round
  score: number;       // Current score
  timestamp: number;   // Event time
  data?: Record<string, unknown>;
}

export interface JuiceState {
  combo: number;              // Current consecutive correct count
  maxCombo: number;           // Highest combo this session
  totalCorrect: number;       // Total correct answers
  totalWrong: number;         // Total wrong answers
  consecutiveWrong: number;   // Current wrong streak
  lastAnswerCorrect: boolean; // Was last answer correct?
  milestonesHit: Set<string>; // Which milestones already triggered
  events: JuiceEvent[];       // All events this session
  juiceLevel: number;         // 0-100, cumulative juice meter
}

export interface ComboTier {
  threshold: number;
  label: string;
  emoji: string;
  color: string;
  glowIntensity: number;
}

export interface MilestoneDef {
  id: string;
  type: JuiceEventType;
  condition: (state: JuiceState, event: JuiceEvent) => boolean;
  title: string;
  message: string;
  emoji: string;
  color: string;
  showPopup: boolean;
}

// ═══ CONSTANTS ═══

export const COMBO_TIERS: ComboTier[] = [
  { threshold: 1, label: 'Nice!', emoji: '👍', color: '#3B82F6', glowIntensity: 0 },
  { threshold: 3, label: 'Good!', emoji: '🔥', color: '#F59E0B', glowIntensity: 0.2 },
  { threshold: 5, label: 'Great!', emoji: '⚡', color: '#F97316', glowIntensity: 0.4 },
  { threshold: 8, label: 'Amazing!', emoji: '🌟', color: '#EF4444', glowIntensity: 0.6 },
  { threshold: 12, label: 'Unstoppable!', emoji: '🔥🔥', color: '#E945F5', glowIntensity: 0.8 },
  { threshold: 20, label: 'LEGENDARY!', emoji: '👑', color: '#FFD700', glowIntensity: 1.0 },
];

export const MILESTONES: MilestoneDef[] = [
  {
    id: 'combo-5',
    type: 'combo_milestone',
    condition: (_s, e) => e.combo === 5,
    title: '5 in a Row!',
    message: 'You are on fire!',
    emoji: '🔥',
    color: '#F59E0B',
    showPopup: true,
  },
  {
    id: 'combo-10',
    type: 'combo_milestone',
    condition: (_s, e) => e.combo === 10,
    title: '10 in a Row!',
    message: 'Incredible streak!',
    emoji: '⚡',
    color: '#EF4444',
    showPopup: true,
  },
  {
    id: 'combo-15',
    type: 'combo_milestone',
    condition: (_s, e) => e.combo === 15,
    title: '15 in a Row!',
    message: 'You cannot be stopped!',
    emoji: '🌟',
    color: '#E945F5',
    showPopup: true,
  },
  {
    id: 'combo-20',
    type: 'combo_milestone',
    condition: (_s, e) => e.combo === 20,
    title: '20 in a Row!',
    message: 'LEGENDARY!',
    emoji: '👑',
    color: '#FFD700',
    showPopup: true,
  },
  {
    id: 'perfect-5',
    type: 'perfect_round',
    condition: (s, _e) => s.totalCorrect >= 5 && s.totalWrong === 0 && s.totalCorrect === 5,
    title: 'Perfect Start!',
    message: '5 correct with zero misses!',
    emoji: '💯',
    color: '#10B981',
    showPopup: true,
  },
  {
    id: 'comeback-3',
    type: 'comeback',
    condition: (s, _e) => s.consecutiveWrong >= 2 && s.lastAnswerCorrect,
    title: 'Comeback!',
    message: 'You bounced back!',
    emoji: '💪',
    color: '#3B82F6',
    showPopup: true,
  },
  {
    id: 'first-correct',
    type: 'correct',
    condition: (s, _e) => s.totalCorrect === 1 && s.totalWrong === 0,
    title: 'First Answer!',
    message: 'Off to a great start!',
    emoji: '🎯',
    color: '#10B981',
    showPopup: false,
  },
];

// ═══ PURE FUNCTIONS ═══

/** Create fresh juice state */
export function createJuiceState(): JuiceState {
  return {
    combo: 0,
    maxCombo: 0,
    totalCorrect: 0,
    totalWrong: 0,
    consecutiveWrong: 0,
    lastAnswerCorrect: false,
    milestonesHit: new Set(),
    events: [],
    juiceLevel: 0,
  };
}

/** Record a correct answer, return updated state + events */
export function recordCorrect(state: JuiceState, round: number, score: number): { state: JuiceState; events: JuiceEvent[] } {
  const newCombo = state.combo + 1;
  const newMaxCombo = Math.max(state.maxCombo, newCombo);
  const newTotalCorrect = state.totalCorrect + 1;

  const timestamp = Date.now();
  const events: JuiceEvent[] = [];

  // Build juice event
  const baseEvent: JuiceEvent = {
    type: newCombo >= 2 ? 'combo_build' : 'correct',
    combo: newCombo,
    maxCombo: newMaxCombo,
    round,
    score,
    timestamp,
  };

  // Combo start event
  if (newCombo === 2) {
    events.push({ ...baseEvent, type: 'combo_start' });
  }

  events.push(baseEvent);

  // Check combo milestones
  const tier = getComboTier(newCombo);
  if (tier && isComboMilestone(newCombo)) {
    events.push({
      ...baseEvent,
      type: 'combo_milestone',
      data: { tier, threshold: newCombo },
    });
  }

  const newState: JuiceState = {
    ...state,
    combo: newCombo,
    maxCombo: newMaxCombo,
    totalCorrect: newTotalCorrect,
    consecutiveWrong: 0,
    lastAnswerCorrect: true,
    events: [...state.events, ...events],
    juiceLevel: Math.min(100, state.juiceLevel + 5),
  };

  // Check all milestones
  const triggeredMilestones = checkMilestones(newState, baseEvent);
  for (const ms of triggeredMilestones) {
    if (!state.milestonesHit.has(ms.id)) {
      newState.milestonesHit = new Set(newState.milestonesHit).add(ms.id);
      if (ms.showPopup) {
        events.push({
          type: ms.type,
          combo: newCombo,
          maxCombo: newMaxCombo,
          round,
          score,
          timestamp: Date.now(),
          data: { milestone: ms },
        });
      }
    }
  }

  return { state: newState, events };
}

/** Record a wrong answer, return updated state + events */
export function recordWrong(state: JuiceState, round: number, score: number): { state: JuiceState; events: JuiceEvent[] } {
  const events: JuiceEvent[] = [];
  const timestamp = Date.now();

  // Combo break event
  if (state.combo >= 2) {
    events.push({
      type: 'combo_break',
      combo: 0,
      maxCombo: state.maxCombo,
      round,
      score,
      timestamp,
      data: { brokenCombo: state.combo },
    });
  }

  events.push({
    type: 'wrong',
    combo: 0,
    maxCombo: state.maxCombo,
    round,
    score,
    timestamp,
  });

  const newConsecutiveWrong = state.consecutiveWrong + 1;

  return {
    state: {
      ...state,
      combo: 0,
      totalWrong: state.totalWrong + 1,
      consecutiveWrong: newConsecutiveWrong,
      lastAnswerCorrect: false,
      events: [...state.events, ...events],
      juiceLevel: Math.max(0, state.juiceLevel - 10),
    },
    events,
  };
}

/** Record hint usage */
export function recordHintUsed(state: JuiceState, round: number, score: number): JuiceState {
  return {
    ...state,
    events: [...state.events, {
      type: 'hint_used',
      combo: state.combo,
      maxCombo: state.maxCombo,
      round,
      score,
      timestamp: Date.now(),
    }],
    juiceLevel: Math.max(0, state.juiceLevel - 3),
  };
}

/** Get current combo tier */
export function getComboTier(combo: number): ComboTier | null {
  let tier: ComboTier | null = null;
  for (const t of COMBO_TIERS) {
    if (combo >= t.threshold) tier = t;
    else break;
  }
  return tier;
}

/** Get combo tier label for display */
export function getComboLabel(combo: number): string {
  const tier = getComboTier(combo);
  return tier ? `${tier.emoji} ${tier.label}` : '';
}

/** Check if a combo count is a milestone number */
function isComboMilestone(combo: number): boolean {
  return combo === 5 || combo === 10 || combo === 15 || combo === 20;
}

/** Check all milestones against current state */
function checkMilestones(state: JuiceState, event: JuiceEvent): MilestoneDef[] {
  return MILESTONES.filter(ms => !state.milestonesHit.has(ms.id) && ms.condition(state, event));
}

/** Get Sparky reaction message for a juice event */
export function getSparkyReaction(event: JuiceEvent): { expression: string; message: string } | null {
  switch (event.type) {
    case 'combo_start':
      return { expression: 'happy', message: 'Combo started! Keep it going!' };
    case 'combo_build':
      if (event.combo >= 10) return { expression: 'excited', message: `${event.combo} in a row! You are UNSTOPPABLE!` };
      if (event.combo >= 5) return { expression: 'excited', message: `${event.combo} in a row! Amazing!` };
      return { expression: 'happy', message: `${event.combo} correct! Nice streak!` };
    case 'combo_break':
      return { expression: 'sad', message: 'Combo broken... but don\'t give up! You can start a new one!' };
    case 'combo_milestone':
      return { expression: 'celebrating', message: (event.data?.milestone as MilestoneDef)?.message || 'Milestone!' };
    case 'correct':
      return { expression: 'happy', message: 'Correct! You got this!' };
    case 'wrong':
      if ((event.data?.brokenCombo as number) >= 5) return { expression: 'sad', message: 'That\'s okay! Long combos are hard. Try again!' };
      return { expression: 'thinking', message: 'Not quite! Think about it and try again!' };
    case 'comeback':
      return { expression: 'excited', message: 'Comeback! I knew you could do it!' };
    case 'perfect_round':
      return { expression: 'celebrating', message: 'PERFECT! Every answer correct!' };
    case 'level_complete':
      return { expression: 'celebrating', message: 'Level complete! You are a star!' };
    default:
      return null;
  }
}

/** Get screen shake intensity for an event */
export function getScreenShakeIntensity(event: JuiceEvent): number {
  switch (event.type) {
    case 'combo_break': return 0.6;
    case 'wrong': return 0.3;
    case 'combo_milestone': return 0.4;
    case 'level_complete': return 0.5;
    default: return 0;
  }
}

/** Get floating text for an event */
export function getFloatingText(event: JuiceEvent): { text: string; color: string; size: 'sm' | 'md' | 'lg' } | null {
  switch (event.type) {
    case 'correct':
      return { text: 'Correct!', color: '#10B981', size: 'md' };
    case 'wrong':
      return { text: 'Try Again!', color: '#EF4444', size: 'md' };
    case 'combo_start':
      return { text: 'Combo!', color: '#F59E0B', size: 'md' };
    case 'combo_build':
      return { text: `x${event.combo}`, color: '#F97316', size: event.combo >= 10 ? 'lg' : 'md' };
    case 'combo_milestone':
      return { text: (event.data?.milestone as MilestoneDef)?.title || 'Milestone!', color: '#FFD700', size: 'lg' };
    case 'combo_break':
      return { text: 'Combo Lost', color: '#64748B', size: 'sm' };
    case 'hint_used':
      return { text: 'Hint Used', color: '#8B5CF6', size: 'sm' };
    default:
      return null;
  }
}

/** Calculate session stats from juice state */
export function getSessionStats(state: JuiceState) {
  const total = state.totalCorrect + state.totalWrong;
  return {
    totalAnswered: total,
    accuracy: total > 0 ? Math.round((state.totalCorrect / total) * 100) : 100,
    maxCombo: state.maxCombo,
    totalCorrect: state.totalCorrect,
    totalWrong: state.totalWrong,
    juiceLevel: state.juiceLevel,
    milestonesHit: state.milestonesHit.size,
  };
}

/** Should show Sparky reaction for this event? */
export function shouldShowSparky(event: JuiceEvent): boolean {
  return event.type === 'combo_milestone'
    || event.type === 'combo_break'
    || (event.type === 'combo_build' && event.combo >= 5)
    || event.type === 'perfect_round'
    || event.type === 'comeback'
    || event.type === 'level_complete';
}
