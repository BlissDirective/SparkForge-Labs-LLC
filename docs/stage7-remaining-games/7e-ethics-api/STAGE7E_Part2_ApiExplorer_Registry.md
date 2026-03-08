# SPARKFORGE — STAGE 7E PART 2: API Explorer + Updated Registry

**Date:** February 20, 2026 | **GCUD Version:** V7
**Batch:** 7E — Missing Games (Content Review Gap Fill)
**Treatment:** Standard polish
**Note:** API Explorer is Band C only (ages 14-16)

## Overview

| Game | Lab | Slug | Tier | Bands | Lines |
|------|-----|------|------|-------|-------|
| API Explorer | 9 (Build with AI) | api-explorer | Std | C only | ~520 |

## Game: API Explorer

**Concept:** Send simulated API requests to an AI service. Choose endpoints, set parameters, see JSON responses. Teaches REST APIs, request/response cycle, JSON format.

**Features:**
- Chrome bezel (orange, Lab 9)
- Particle background
- Welcome + learn phases
- 5 endpoints: /classify, /generate, /translate, /sentiment, /chat
- Request builder with parameter inputs
- Animated "sending" state
- JSON response viewer with syntax highlighting
- Status codes explained (200, 400, 429, 500)
- Request history log
- ARIA labels

**File:** `src/components/games/ApiExplorerGame.tsx`

## Updated Game Registry

### Add to `src/components/games/index.ts`:

```typescript
// Stage 7E — Missing games (gap fill)
export { EthicsCourtroomGame } from './EthicsCourtroomGame';
export { BuildClassifierGame } from './BuildClassifierGame';
export { ApiExplorerGame } from './ApiExplorerGame';
```

### Game Router entries (Stage 10):

```typescript
'ethics-courtroom': EthicsCourtroomGame,
'build-classifier': BuildClassifierGame,
'api-explorer': ApiExplorerGame,
```

## Game Content Review — Gap Closure Status

| Gap | Status | Notes |
|-----|--------|-------|
| Ethics Courtroom | RESOLVED | 4 cases, 3 perspectives each, argument strength rating |
| Build a Classifier | RESOLVED | Full ML pipeline: collect → train → test → results |
| Vibe Coder | RESOLVED (Stage 7C) | Previously delivered |
| API Explorer | RESOLVED | 5 endpoints, JSON viewer, request history |
| **All 4 missing games** | **COMPLETE** | 28/28 curriculum games now have implementations |

## Store API Notes

**IMPORTANT:** Uses corrected store API per PROGRESS.md audit:
- `game.updateScore(pts)` — NOT `game.addScore()`
- `game.advanceRound()` — NOT `game.nextRound()`
- `game.completeGame()` — correct as-is
