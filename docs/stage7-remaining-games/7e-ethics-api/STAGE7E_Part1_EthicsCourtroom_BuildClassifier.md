# SPARKFORGE — STAGE 7E PART 1: Ethics Courtroom + Build a Classifier

**Date:** February 20, 2026 | **GCUD Version:** V7
**Batch:** 7E — Missing Games (Content Review Gap Fill)
**Treatment:** Standard polish (both games)
**Priority:** P1 Critical — Games listed in curriculum but missing from codebase

## Overview

Two new standard-polish games for Stage 7E:

| Game | Lab | Slug | Tier | Bands | Lines |
|------|-----|------|------|-------|-------|
| Ethics Courtroom | 6 (AI & Ethics) | ethics-courtroom | Std | B, C | ~450 |
| Build a Classifier | 7 (Computer Vision) | build-classifier | Std | B, C | ~500 |

## Game 1: Ethics Courtroom

**Concept:** Role-play ethical AI dilemmas. Read the case, choose a perspective to argue, present arguments, see the jury verdict. Multiple valid outcomes teach ethical complexity — no "right" answer.

**Features:**
- Chrome bezel (red, Lab 6)
- Particle background
- Welcome phase with ethics intro
- Age-band depth (C: stakeholder analysis, consequentialism vs deontology)
- 4 cases with 3 perspectives each
- Jury verdict with reasoning
- "No single right answer" philosophy emphasized
- ARIA labels, keyboard nav

**Flow:** Welcome → Learn → Case → Perspective → Argue → Verdict → repeat

**Cases:**
1. The Self-Driving Decision
2. The AI Job Interview
3. The Student AI Detector
4. The Health AI

**Age-band C extras:** Consequentialism vs deontology, Bayes' theorem, EU AI Act references

**File:** `src/components/games/EthicsCourtroomGame.tsx`

## Game 2: Build a Classifier

**Concept:** Collect training images (emoji-based), label them into categories, train a simulated classifier, then test it on new images. Teaches the full ML training pipeline.

**Features:**
- Chrome bezel (cyan, Lab 7)
- Particle background
- Welcome + learn phases
- 3-step pipeline: Collect → Train → Test
- Visual training progress animation
- Confusion matrix on results
- Age-band depth (C: precision/recall, overfitting)
- ARIA labels

**Pipeline:** Collect (18 images) → Train (animated) → Test (9-12 images) → Results

**Age-band C extras:** Confusion matrix, precision/recall concepts, trick test items

**File:** `src/components/games/BuildClassifierGame.tsx`

## Store API Notes

**IMPORTANT:** Uses corrected store API per PROGRESS.md audit:
- `game.updateScore(pts)` — NOT `game.addScore()`
- `game.advanceRound()` — NOT `game.nextRound()`
- `game.completeGame()` — correct as-is

## V1 → V2 NOTES

These are **NEW games** — no V1 existed.

### Ethics Courtroom (NEW)
- Lines: ~450
- Cases: 4 real-world dilemmas (self-driving, hiring bias, AI detectors, health AI)
- Perspectives: 3 per case with 3 arguments each (strong/moderate/weak rated)
- Flow: Welcome → Learn → Case → Perspective → Argue → Verdict → repeat
- Age-band C: Consequentialism vs deontology, Bayes' theorem, EU AI Act references
- Design: Red chrome bezel, particles, argument strength badges, jury reflection

### Build a Classifier (NEW)
- Lines: ~500
- Pipeline: Collect (18 images) → Train (animated) → Test (9-12 images) → Results
- Balance: Visual data balance counter per category warns about imbalanced data
- Age-band C: Confusion matrix, precision/recall concepts, trick test items
- Design: Cyan chrome bezel, pipeline progress indicator, category-colored buttons
