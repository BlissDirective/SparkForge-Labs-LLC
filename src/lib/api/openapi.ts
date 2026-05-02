// ════════════════════════════════════════════════════════════════
// openapi — API-ENH OpenAPI 3.1 Spec + Auto-Typed Client (Ultra)
// Phase 5 task #9 · Final-Audit_04-15-2026.md
// ════════════════════════════════════════════════════════════════
// Single-source-of-truth OpenAPI 3.1 spec. Zod schemas are the
// canonical contract; this module re-exports them as an OpenAPI
// registry, then emits a spec document via @asteasolutions/zod-to-
// openapi.
//
// How it fits together:
//
//   src/lib/validations.ts  (existing Zod schemas)
//           │
//           ▼
//   src/lib/api/openapi.ts  (this file — registers schemas + paths)
//           │
//           ▼
//   scripts/generate-api-client.mjs  (emits TypeScript client + MSW handlers)
//           │
//           ▼
//   src/lib/api/client.ts   (generated — fully-typed fetch client)
//   src/lib/api/mocks.ts    (generated — MSW handlers)
//
// The versioning layer (v1/v2 route prefixes + deprecation warnings)
// lives in `src/lib/api/versioning.ts`.
// ════════════════════════════════════════════════════════════════

import {
  OpenAPIRegistry,
  OpenApiGeneratorV31,
  extendZodWithOpenApi,
} from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// Activate .openapi() extension on every z.* call.
extendZodWithOpenApi(z);

export const openApiRegistry = new OpenAPIRegistry();

// ─── Common schemas ──────────────────────────────────────────────

export const ErrorResponse = z
  .object({
    success: z.literal(false),
    error: z.string().openapi({ example: 'Invalid request' }),
    code: z.string().optional().openapi({ example: 'VALIDATION_ERROR' }),
    details: z.array(z.string()).optional(),
  })
  .openapi('ErrorResponse');

export const EmptySuccessResponse = z
  .object({
    success: z.literal(true),
    data: z.object({}).openapi({ description: 'Empty success payload' }),
  })
  .openapi('EmptySuccessResponse');

openApiRegistry.register('ErrorResponse', ErrorResponse);
openApiRegistry.register('EmptySuccessResponse', EmptySuccessResponse);

// ─── Auth ─────────────────────────────────────────────────────────

export const LoginRequest = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
  })
  .openapi('LoginRequest');

export const MeResponse = z
  .object({
    success: z.literal(true),
    data: z.object({
      id: z.string().uuid(),
      email: z.string().email(),
      fullName: z.string().nullable(),
      subscriptionTier: z.enum(['free', 'plus', 'forge']),
      subscriptionStatus: z.string(),
      stripeCustomerId: z.string().nullable(),
      stripeSubscriptionId: z.string().nullable(),
      trialEndsAt: z.string().nullable(),
      subscriptionPeriodEnd: z.string().nullable(),
      onboardingComplete: z.boolean(),
      isAdmin: z.boolean(),
      createdAt: z.string(),
    }),
  })
  .openapi('MeResponse');

openApiRegistry.register('LoginRequest', LoginRequest);
openApiRegistry.register('MeResponse', MeResponse);

openApiRegistry.registerPath({
  method: 'post',
  path: '/api/auth/login',
  tags: ['auth'],
  summary: 'Email + password sign-in',
  request: {
    body: { content: { 'application/json': { schema: LoginRequest } } },
  },
  responses: {
    200: {
      description: 'Session established (cookie set by server)',
      content: { 'application/json': { schema: EmptySuccessResponse } },
    },
    400: {
      description: 'Validation error',
      content: { 'application/json': { schema: ErrorResponse } },
    },
    401: {
      description: 'Invalid credentials',
      content: { 'application/json': { schema: ErrorResponse } },
    },
  },
});

openApiRegistry.registerPath({
  method: 'get',
  path: '/api/auth/me',
  tags: ['auth'],
  summary: 'Current parent profile',
  responses: {
    200: {
      description: 'Profile loaded',
      content: { 'application/json': { schema: MeResponse } },
    },
    401: {
      description: 'Not authenticated',
      content: { 'application/json': { schema: ErrorResponse } },
    },
  },
});

// ─── Passkeys ─────────────────────────────────────────────────────

export const PasskeySummary = z
  .object({
    id: z.string(),
    nickname: z.string(),
    deviceType: z.enum(['singleDevice', 'multiDevice']),
    backedUp: z.boolean(),
    forgeAttested: z.boolean(),
    aaguid: z.string().nullable(),
    createdAt: z.string(),
    lastUsedAt: z.string().nullable(),
    authenticatorModel: z.string().nullable().optional(),
  })
  .openapi('PasskeySummary');

export const PasskeyListResponse = z
  .object({
    success: z.literal(true),
    data: z.object({ passkeys: z.array(PasskeySummary) }),
  })
  .openapi('PasskeyListResponse');

openApiRegistry.register('PasskeySummary', PasskeySummary);
openApiRegistry.register('PasskeyListResponse', PasskeyListResponse);

openApiRegistry.registerPath({
  method: 'get',
  path: '/api/auth/passkeys',
  tags: ['auth', 'passkeys'],
  summary: 'List caller\'s registered passkeys',
  responses: {
    200: {
      description: 'Passkey list',
      content: { 'application/json': { schema: PasskeyListResponse } },
    },
    404: {
      description: 'Passkey auth not enabled',
      content: { 'application/json': { schema: ErrorResponse } },
    },
  },
});

openApiRegistry.registerPath({
  method: 'delete',
  path: '/api/auth/passkeys',
  tags: ['auth', 'passkeys'],
  summary: 'Revoke a passkey',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({ credentialId: z.string() }),
        },
      },
    },
  },
  responses: {
    200: { description: 'Revoked', content: { 'application/json': { schema: EmptySuccessResponse } } },
    404: { description: 'Not found', content: { 'application/json': { schema: ErrorResponse } } },
  },
});

// ─── Sessions ────────────────────────────────────────────────────

export const SessionSummary = z
  .object({
    id: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    userAgent: z.string().nullable(),
    ip: z.string().nullable(),
    current: z.boolean(),
  })
  .openapi('SessionSummary');

export const SessionListResponse = z
  .object({
    success: z.literal(true),
    data: z.object({ sessions: z.array(SessionSummary) }),
  })
  .openapi('SessionListResponse');

openApiRegistry.register('SessionSummary', SessionSummary);
openApiRegistry.register('SessionListResponse', SessionListResponse);

openApiRegistry.registerPath({
  method: 'get',
  path: '/api/auth/sessions',
  tags: ['auth', 'sessions'],
  summary: 'List active refresh tokens for the caller',
  responses: {
    200: {
      description: 'Session list',
      content: { 'application/json': { schema: SessionListResponse } },
    },
  },
});

// ─── Stripe ──────────────────────────────────────────────────────

export const InvoicePreviewRequest = z
  .object({ targetPriceId: z.string().min(1) })
  .openapi('InvoicePreviewRequest');

export const InvoicePreviewResponse = z
  .object({
    success: z.literal(true),
    data: z.object({
      currency: z.string(),
      subtotalCents: z.number(),
      taxCents: z.number(),
      totalCents: z.number(),
      amountDueCents: z.number(),
      periodStart: z.number().nullable(),
      periodEnd: z.number().nullable(),
      items: z.array(
        z.object({
          description: z.string(),
          amountCents: z.number(),
          periodStart: z.number().nullable(),
          periodEnd: z.number().nullable(),
          proration: z.boolean(),
        }),
      ),
    }),
  })
  .openapi('InvoicePreviewResponse');

openApiRegistry.register('InvoicePreviewRequest', InvoicePreviewRequest);
openApiRegistry.register('InvoicePreviewResponse', InvoicePreviewResponse);

openApiRegistry.registerPath({
  method: 'post',
  path: '/api/stripe/invoice-preview',
  tags: ['stripe'],
  summary: 'Preview prorated charge for a plan change',
  request: {
    body: { content: { 'application/json': { schema: InvoicePreviewRequest } } },
  },
  responses: {
    200: {
      description: 'Preview computed',
      content: { 'application/json': { schema: InvoicePreviewResponse } },
    },
    403: { description: 'Forbidden', content: { 'application/json': { schema: ErrorResponse } } },
    502: { description: 'Stripe error', content: { 'application/json': { schema: ErrorResponse } } },
  },
});

// ─── Preload manifest ─────────────────────────────────────────────

export const PreloadEntry = z
  .object({
    url: z.string(),
    kind: z.enum(['gltf', 'ktx2', 'hdri', 'basis']),
    priority: z.number().min(0).max(1),
    sizeBytes: z.number().optional(),
    lod: z.string().optional(),
  })
  .openapi('PreloadEntry');

export const PreloadManifestResponse = z
  .object({
    success: z.literal(true),
    data: z.object({
      manifest: z.object({
        builtAt: z.string(),
        userId: z.string().uuid(),
        entries: z.array(PreloadEntry),
      }),
    }),
  })
  .openapi('PreloadManifestResponse');

openApiRegistry.register('PreloadEntry', PreloadEntry);
openApiRegistry.register('PreloadManifestResponse', PreloadManifestResponse);

openApiRegistry.registerPath({
  method: 'get',
  path: '/api/jobs/preload-manifest',
  tags: ['jobs', '3d'],
  summary: '3D asset preload manifest for the current user',
  responses: {
    200: {
      description: 'Manifest computed',
      content: { 'application/json': { schema: PreloadManifestResponse } },
    },
  },
});

// ─── Spec generator ───────────────────────────────────────────────

export function generateOpenApiSpec() {
  const generator = new OpenApiGeneratorV31(openApiRegistry.definitions);
  return generator.generateDocument({
    openapi: '3.1.0',
    info: {
      version: '1.0.0',
      title: 'SparkForge API',
      description:
        'SparkForge gamified AI learning platform. Schemas auto-generated from Zod validators.',
      license: { name: 'Proprietary', url: 'https://sparkforge-labs.com' },
    },
    servers: [
      { url: '{appUrl}', variables: { appUrl: { default: 'https://sparkforge-labs.com' } } },
    ],
    tags: [
      { name: 'auth', description: 'Authentication + passkeys + sessions' },
      { name: 'stripe', description: 'Subscription + billing' },
      { name: 'jobs', description: 'Backend jobs + cron hooks' },
      { name: '3d', description: '3D asset pipeline' },
    ],
  });
}
