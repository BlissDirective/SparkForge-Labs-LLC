# SparkForge — Design Compliance Matrix

**Generated:** 2026-07-02 · **Source:** `src/lib/3d/cockpitDesignTokens.ts`

This table is auto-generated. Edit the source token file, then rerun
`node scripts/generate-design-matrix.mjs --write`.

---

## 1. TYPOGRAPHY

| Token | Value | Decision(s) | Description |
|---|---|---|---|
| `TYPE_SCALE` | `{…` | — | — |
| `NUMERIC_FONT` | `'/fonts/Orbitron-Bold.woff2'` | — | — |
| `NUMERIC_FONT_FAMILY` | `'Orbitron-Bold'` | — | — |
| `TEXT_COLORS` | `{…` | — | — |

## 2. EDGES

| Token | Value | Decision(s) | Description |
|---|---|---|---|
| `BEVEL_STYLE` | `{…` | — | — |
| `BORDER_RADIUS` | `{ small: 4, medium: 8, large: 12, } as const` | — | — |
| `CHROME_BORDER` | `{…` | — | — |
| `HOVER_GLOW` | `{…` | — | — |

## 3. DEPTH LAYERS

| Token | Value | Decision(s) | Description |
|---|---|---|---|
| `DEPTH_STEP` | `0.005` | — | — |
| `DEPTH_LAYERS` | `{…` | — | — |
| `PRESS_DEPTH` | `0.03` | — | — |

## 4. SPRING PRESETS

| Token | Value | Decision(s) | Description |
|---|---|---|---|
| `SPRING_PRESETS` | `{…` | — | — |
| `TRANSITION_DURATION_MS` | `400` | — | — |
| `TRANSITION_EASING` | `'ease-out-cubic'` | — | — |
| `CELEBRATION_TIERS` | `{…` | — | — |

## 5. EMISSIVE SCALE

| Token | Value | Decision(s) | Description |
|---|---|---|---|
| `EMISSIVE_SCALE` | `{…` | — | — |
| `EMISSIVE_IDLE_BUTTON` | `0.8` | — | — |
| `EMISSIVE_IDLE_INDICATOR` | `0.5` | — | — |
| `EMISSIVE_HOVER_MULTIPLIER` | `1.8` | — | — |
| `EMISSIVE_LED_MULTIPLIER` | `1.5` | — | — |

## 6. MODE COLOR TEMPERATURE

| Token | Value | Decision(s) | Description |
|---|---|---|---|
| `SURFACE_TINT_BLEND` | `0.05` | — | — |
| `MODE_FILL_LIGHT` | `{…` | — | — |
| `PARTICLE_CROSSFADE_S` | `1.5` | — | — |

## 7. COMPONENT STATE MACHINES

| Token | Value | Decision(s) | Description |
|---|---|---|---|
| `STATE_MACHINE` | `{…` | — | — |

## 8. SURFACE DETAIL

| Token | Value | Decision(s) | Description |
|---|---|---|---|
| `PANEL_SEAMS` | `{…` | — | — |
| `MICRO_TEXTURE` | `{…` | — | — |
| `ACCENT_LINES` | `{…` | — | — |
| `FOCUS_CONFIG` | `{…` | — | — |
| `MODE_FOCUS_TARGETS` | `{…` | — | — |
| `MAX_VISIBLE_ITEMS` | `{…` | — | — |
| `WHITESPACE_RATIO` | `0.40` | — | — |
| `GHOST_PLACEHOLDER_OPACITY` | `0.10` | — | — |
| `RIPPLE_OFFSETS_MS` | `{…` | — | — |
| `ALWAYS_RESPOND` | `['led_rim', 'status_bar'] as const` | — | — |
| `DAMPENING` | `{…` | — | — |
| `AUDIO_DISTANCE_FALLOFF` | `'flat' as const` | — | — |
| `MECHANICAL_DENSITY_DEFAULT` | `0.5` | — | — |
| `AUDIO_PRIORITY_ORDER` | `[…` | — | — |
| `AUDIO_DUCK_VOLUME` | `0.4` | — | — |
| `LAB_CROSSFADE_TYPE` | `'hard_cut' as const` | — | — |

---

**Total tokens documented:** 40

See also: `DESIGN_DECISIONS_LOG.md` for decision rationale, `Master-SparkForge-UI-Design-Change.md` for the full spec.
