# Forge Hub — feature flags (W10-01)

**Owner of this doc:** Gatekeeper. **Written 2026-09-15** as the skeleton. No production flag is flipped without an owner packet (plan §11.3).

Flags follow the Concept 10 pattern in `src/config/feature-flags.ts`: `flag('KEY', defaultValue)` read from `NEXT_PUBLIC_<KEY>`. Sub-flags are AND-ed with `FORGE_HUB` at their call sites, so one env var rolls everything back.

| Flag | Env var | Default | Gates | Status |
|---|---|---|---|---|
| `FORGE_HUB` | `NEXT_PUBLIC_FORGE_HUB` | `false` | The root-layout stage mount on desktop and ultrawide; the `forge-hub` theme; `ForgeRouteMode`. Off = today's HTML shell on every tier. | **Not yet defined in code.** `/dev/forge-hub` is always on and does not read it. Stagehand adds it in W2 root-layout mount. |
| `FORGE_HUB_WELCOME` | `NEXT_PUBLIC_FORGE_HUB_WELCOME` | `false` | Wave 1: `/`, `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/home`, `/onboarding` on the stage | Not yet defined (Glazier, W4 wave 1) |
| `FORGE_HUB_LABS` | `NEXT_PUBLIC_FORGE_HUB_LABS` | `false` | Wave 2: `/labs`, `/labs/[labId]`, `/content/[slug]`, `/story` | Not yet defined |
| `FORGE_HUB_ARCADE` | `NEXT_PUBLIC_FORGE_HUB_ARCADE` | `false` | Wave 3: `/arcade`, games on `PlayStage`, `/create` | Not yet defined |
| `FORGE_HUB_PROGRESS` | `NEXT_PUBLIC_FORGE_HUB_PROGRESS` | `false` | Wave 4: `/progress`, `/achievements`, `/mastery`, `/seasons`, `/buddies` | Not yet defined |
| `FORGE_HUB_PROFILE` | `NEXT_PUBLIC_FORGE_HUB_PROFILE` | `false` | Wave 5: `/profile`, `/settings`, `/competencies` | Not yet defined |
| `FORGE_HUB_ROLLOUT_PERCENT` | `NEXT_PUBLIC_FORGE_HUB_ROLLOUT_PERCENT` | `0` | W10 step 4: percentage of desktop sessions (stable hash of the session id) that see the stage when `FORGE_HUB` is on | Not yet defined (Gatekeeper with Stagehand, Tier 1) |

## Rollout steps (each is an owner packet)

1. Previews only: flags on in Vercel preview environment.
2. Staff accounts.
3. Demo sessions.
4. 10 percent of desktop sessions via `FORGE_HUB_ROLLOUT_PERCENT`.
5. 100 percent.

## Kill switch

`NEXT_PUBLIC_FORGE_HUB=false` in the Vercel production environment restores the HTML shell on all tiers with no deploy beyond the env change. Gatekeeper verifies this on a preview before every production step and pastes the proof in the packet.

## Where env vars live

Vercel dashboard → Project `sparkforge-labs` → Settings → Environment Variables, per environment (Preview, Production). Never in the repo, never in chat.
