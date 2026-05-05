'use client';

/**
 * LoginPanelSlot — drop-in 3D auth form panel.
 * ════════════════════════════════════════════════════════════════════
 *
 * Purpose for AI design tools (read src/registry/README.md first):
 *   The complete email/password/OAuth/demo login UI is rendered as a
 *   3D panel inside an R3F scene (LoginPanel3D). It owns its own
 *   chrome — chrome bezel, Frost-Prismatic glow, error region, demo
 *   confirmation flow — internally. Don't try to reproduce any of
 *   that in HTML.
 *
 *   When generating an auth-page redesign:
 *     - Compose around this slot (background portal, particle layer,
 *       branding header, etc.) — DO NOT recreate the form.
 *     - Pass through the auth handlers from the route page.
 *     - The slot fills its parent; size the parent to whatever your
 *       new layout dictates.
 *
 * The panel currently expects to be rendered inside a parent <Canvas>
 * (see src/app/(auth)/layout.tsx for the existing wiring). If a redesign
 * removes that Canvas, wrap this slot in its own Canvas with the same
 * camera + gl settings.
 *
 * Status lane: 🟢 Core / Preserve — owns auth UX, including the
 * post-redesign a11y + autofill fixes (P1/L5–L7 audit).
 *
 * Re-exports the underlying component directly so consumers see the
 * full prop surface. See LoginPanel3DProps in the source for the
 * complete signature (handlers, error, loading, demoExpired, etc.).
 * ════════════════════════════════════════════════════════════════════ */

export { default as LoginPanelSlot } from '@/components/3d/panels/LoginPanel3D';
