import { z } from 'zod';

// ═══ AUTH SCHEMAS ═══

export const SignupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password cannot exceed 72 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  fullName: z.string().min(1, 'Name is required').max(100).optional(),
  timezone: z.string().max(50).default('UTC'),
});

// S3-HIGH-001: Separate COPPA consent schema — called in Step 3 AFTER user confirms
export const CoppaConsentSchema = z.object({
  email: z.string().email(),
  coppaConsent: z.literal(true, {
    errorMap: () => ({ message: 'Parental consent is required' }),
  }),
});

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const ResetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const UpdatePasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72)
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[a-z]/, 'Must contain a lowercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
});

// ═══ CHILD SCHEMAS ═══

export const AgeBandSchema = z.enum(['A', 'B', 'C']);

export const AvatarConfigSchema = z.object({
  skinTone: z.string().default('#FDBCB4'),
  hairStyle: z.string().default('short'),
  hairColor: z.string().default('#3B2F2F'),
  eyeColor: z.string().default('#634e34'),
  faceShape: z.string().default('round'),
  accessories: z.array(z.string()).default([]),
  outfit: z.string().default('astronaut'),
  background: z.string().default('stars'),
  pet: z.string().optional(),
}).passthrough();

export const CreateChildSchema = z.object({
  displayName: z
    .string()
    .min(1, 'Display name is required')
    .max(20, 'Display name cannot exceed 20 characters')
    .regex(/^[a-zA-Z0-9_ -]+$/, 'Display name can only contain letters, numbers, spaces, hyphens, and underscores'),
  birthYear: z.number().int().min(2008).max(2020).optional(),
  age: z.number().int().min(5).max(18).optional(),
  ageBand: AgeBandSchema,
  avatarConfig: AvatarConfigSchema.optional(),
});

// API-HIGH-001 (B): Replace unbounded `z.record(z.unknown())` with a
// properly-typed partial of the AvatarConfigSchema so updates are
// constrained to the known avatar fields. Avoids clients writing
// arbitrary keys or large payloads into children.avatar_config.
export const UpdateChildSchema = z.object({
  displayName: z.string().min(1).max(20).regex(/^[a-zA-Z0-9_ -]+$/).optional(),
  avatarConfig: AvatarConfigSchema.partial().optional(),
  dailyTimeLimitMinutes: z.number().int().min(15).max(480).nullable().optional(),
  promptLabEnabled: z.boolean().optional(),
  preferences: z.object({
    fontSize: z.enum(['normal', 'large', 'extra-large']).optional(),
    dyslexiaFont: z.boolean().optional(),
    reduceMotion: z.boolean().optional(),
    highContrast: z.boolean().optional(),
    soundEnabled: z.boolean().optional(),
  }).optional(),
});

export const ChildIdSchema = z.object({
  childId: z.string().uuid('Invalid child ID'),
});

// ═══ CONTENT SCHEMAS ═══
// Note: query parameter uses "world" (DB column name)

export const ContentQuerySchema = z.object({
  world: z.coerce.number().int().min(1).max(10).optional(),
  ageBand: AgeBandSchema.optional(),
  type: z.string().optional(), // Phase 1: Accepts single or comma-separated types
  gameSlug: z.string().optional(), // Phase 2: Filter by game slug
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const ContentSlugSchema = z.object({
  slug: z.string().min(1).max(200),
});

// ═══ PROGRESS SCHEMAS ═══

export const CreateProgressSchema = z.object({
  childId: z.string().uuid(),
  contentId: z.string().uuid(),
});

export const UpdateProgressSchema = z.object({
  childId: z.string().uuid(),
  contentId: z.string().uuid(),
  completed: z.boolean().optional(),
  score: z.number().min(0).max(100).optional(),
  timeSpentSeconds: z.number().int().min(0).max(86400).optional(),
});

export const CompleteContentSchema = z.object({
  childId: z.string().uuid(),
  contentId: z.string().uuid(),
  score: z.number().min(0).max(100).optional(),
  timeSpentSeconds: z.number().int().min(0).max(86400).default(0),
});

// ═══ GAMIFICATION SCHEMAS ═══

// API-HIGH-003 (C): Server-authoritative XP for `source === 'game'`.
// - For games, client sends `gameId`; server looks up the canonical
//   reward in game-xp-config.ts. `amount` is accepted for backwards
//   compat but IGNORED by the route handler.
// - For non-game sources (lessons, quizzes, spark facts), `amount`
//   remains the request-level value (capped at 500).
export const AwardXPSchema = z.object({
  childId: z.string().uuid(),
  source: z.enum(['lesson', 'quiz', 'game', 'daily_challenge', 'spark_fact', 'activity', 'bonus']),
  gameId: z.string().min(1).max(64).optional(),
  amount: z.number().int().min(1).max(500).optional(),
});

// ═══ PROMPT LAB SCHEMAS ═══

export const PromptLabSchema = z.object({
  childId: z.string().uuid(),
  prompt: z
    .string()
    .min(1, 'Please type something!')
    .max(1000, 'Message is too long — try keeping it under 1000 characters'),
  temperature: z.number().min(0).max(1).default(0.5),
  ageBand: AgeBandSchema,
});

// ═══ STRIPE SCHEMAS ═══

export const CheckoutSchema = z.object({
  tier: z.enum(['plus', 'forge']),
  interval: z.enum(['month', 'year']).default('month'),
});

export const PortalSchema = z.object({
  returnUrl: z.string().url().optional(),
});

// v3 Gap 3: User-initiated plan change / downgrade
export const ChangeSubscriptionSchema = z.object({
  targetTier: z.enum(['free', 'plus', 'forge']),
  interval: z.enum(['month', 'year']).default('month'),
  // Optional — children the user agrees to archive when the new tier's
  // maxChildren is lower than the current count.
  archiveChildIds: z.array(z.string().uuid()).optional(),
});

// v3 Gap 1: Admin subscription actions
export const AdminCancelSubscriptionSchema = z.object({
  parentId: z.string().uuid(),
  immediate: z.boolean().default(false),
  reason: z.string().max(500).optional(),
});

export const AdminChangeSubscriptionSchema = z.object({
  parentId: z.string().uuid(),
  targetTier: z.enum(['free', 'plus', 'forge']),
  interval: z.enum(['month', 'year']).default('month'),
  reason: z.string().max(500).optional(),
});

// ═══ CONTENT AGENT SCHEMAS ═══

export const AgentRunSchema = z.object({
  searchQueries: z.array(z.string().max(200)).min(1).max(10).optional(),
  targetWorlds: z.array(z.number().int().min(1).max(10)).optional(),
  targetBands: z.array(AgeBandSchema).optional(),
  maxItems: z.number().int().min(1).max(50).default(10),
});

export const ReviewContentSchema = z.object({
  queueItemId: z.string().uuid(),
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().max(500).optional(),
});

export const BulkReviewSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(50),
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().max(500).optional(),
});

// ═══ SESSION SCHEMAS ═══

export const StartSessionSchema = z.object({
  childId: z.string().uuid(),
});

export const EndSessionSchema = z.object({
  sessionId: z.string().uuid(),
});

// ═══ LAB PROGRESS SCHEMA ═══
// UI calls it "lab" but the API query param is "world" (DB column)

export const LabProgressSchema = z.object({
  childId: z.string().uuid(),
  world: z.coerce.number().int().min(1).max(10),
});

// ═══ TYPE EXPORTS ═══
// Auto-generate TypeScript types from Zod schemas

export type SignupInput = z.infer<typeof SignupSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type CreateChildInput = z.infer<typeof CreateChildSchema>;
export type UpdateChildInput = z.infer<typeof UpdateChildSchema>;
export type ContentQueryInput = z.infer<typeof ContentQuerySchema>;
export type CreateProgressInput = z.infer<typeof CreateProgressSchema>;
export type UpdateProgressInput = z.infer<typeof UpdateProgressSchema>;
export type CompleteContentInput = z.infer<typeof CompleteContentSchema>;
export type AwardXPInput = z.infer<typeof AwardXPSchema>;
export type PromptLabInput = z.infer<typeof PromptLabSchema>;
export type CheckoutInput = z.infer<typeof CheckoutSchema>;
export type AgentRunInput = z.infer<typeof AgentRunSchema>;
export type ReviewContentInput = z.infer<typeof ReviewContentSchema>;
export type BulkReviewInput = z.infer<typeof BulkReviewSchema>;
