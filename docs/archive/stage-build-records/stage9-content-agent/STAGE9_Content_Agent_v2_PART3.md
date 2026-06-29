# Stage 9 Part 3 (9C) — Seed Content: 150 Lessons, 90 Quizzes, 60 Spark Facts

**Version:** v2 (Frost-Prismatic v2.1) — Audited & Corrected
**Build Phase:** 25
**Date:** February 23, 2026 | **Audited:** March 11, 2026
**Prerequisites:** Stage 9 Parts 1-2 (9A-9B) complete, `content` table exists (Stage 2 v2)
**Validation:** `npm run build` PASS, `npx tsc --noEmit` PASS

---

## Overview

This part provides the complete seed content for all 10 SparkForge Labs — 300 curated educational items covering AI concepts appropriate for children ages 7–16. The content is distributed across three age bands (A, B, C) and three content types (lessons, quizzes, spark facts). This seed data populates the `content` table, providing a rich starter catalog so the platform is immediately usable without waiting for the Content Agent pipeline (Parts 1-2) to generate content.

### PART 3 (9C) COVERS

- 150 lessons across 10 Labs × 3 age bands (5 per Lab per band)
- 90 quizzes across 10 Labs × 3 age bands (3 per Lab per band, 5 questions each)
- 60 spark facts across 10 Labs × 3 age bands (2 per Lab per band)
- SQL seed file for execution in Supabase SQL Editor
- TypeScript seed utility script
- Full Stage 9 validation checklist

### v2 Changes in This Part

| ID | Description |
|----|-------------|
| **ENH-9D** | Complete 10-lab seed coverage — source doc only had Labs 1-3 with 80 items; this provides 300 items |
| **ENH-9E** | Inline quiz questions as JSONB in INSERT (source doc used fragile UPDATE approach) |
| **ENH-9F** | Per-band free tier gating (first lesson + first quiz per band free, all facts free) |
| **FIX-PATH** | SQL files in `sql/` directory (source doc incorrectly used `prisma/`) |
| **FIX-TRUNC** | All content fully written (source doc had truncated/cut-off SQL throughout) |
| **FIX-SCHEMA** | INSERT columns match Stage 2 `content` table schema exactly |

### Content Distribution

| Lab | World | Topic | Lessons | Quizzes | Facts | Total |
|-----|-------|-------|---------|---------|-------|-------|
| 1 | 1 | What IS AI? | 15 | 9 | 6 | 30 |
| 2 | 2 | Teaching Machines | 15 | 9 | 6 | 30 |
| 3 | 3 | Neural Networks | 15 | 9 | 6 | 30 |
| 4 | 4 | Generative AI | 15 | 9 | 6 | 30 |
| 5 | 5 | AI Agents | 15 | 9 | 6 | 30 |
| 6 | 6 | AI Ethics | 15 | 9 | 6 | 30 |
| 7 | 7 | Computer Vision | 15 | 9 | 6 | 30 |
| 8 | 8 | Language & NLP | 15 | 9 | 6 | 30 |
| 9 | 9 | Coding with AI | 15 | 9 | 6 | 30 |
| 10 | 10 | AI Futures | 15 | 9 | 6 | 30 |
| **Total** | | | **150** | **90** | **60** | **300** |

### Age Band Content Guidelines

| Band | Ages | Reading Level | Style | Difficulty |
|------|------|---------------|-------|------------|
| A | 7–9 | Flesch 90-100 (Grade 5) | Simple, fun analogies, everyday examples | beginner |
| B | 10–13 | Flesch 60-70 (Grade 8-9) | Clear, technical terms introduced, relatable | intermediate |
| C | 14–16 | Flesch 30-50 (College) | Technical, deeper concepts, real-world apps | advanced |

### XP Rewards

| Type | XP | Estimated Minutes |
|------|-----|-------------------|
| Lesson | 15 | 6-12 (varies by band) |
| Quiz | 30 | 5-8 (varies by band) |
| Spark Fact | 5 | 1 |

### Free Content Strategy

Each Lab provides free samples to showcase the platform:
- First lesson per band (sort_order 1): **free**
- First quiz per band (sort_order 6): **free**
- All spark facts: **free**
- All other content: **requires subscription**

### Files Created / Modified

| # | File | Action | Purpose |
|---|------|--------|---------|
| 1 | `sql/stage9-seed-content.sql` | CREATE | 300 INSERT statements for `content` table (9,265 lines) |
| 2 | `src/lib/agent/seed.ts` | CREATE | TypeScript seed utility (validates connection + displays stats) |

### Code Review Fixes Applied (vs. Original Source Document)

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| 1 | **CRITICAL** | All SQL INSERT statements truncated mid-value — none can execute | Fully generated all 300 complete INSERT statements with full content |
| 2 | **CRITICAL** | Only 80 items (30 lessons + 30 quizzes + 20 facts) vs CLAUDE.md spec of 300 | Expanded to 150 lessons + 90 quizzes + 60 facts per spec |
| 3 | **CRITICAL** | Uses `prisma/` directory for SQL files — project uses `sql/` (Stages 2, 8) | Changed all paths to `sql/` |
| 4 | **CRITICAL** | Quiz questions use fragile 2-step INSERT + UPDATE approach | Merged: quiz_questions JSONB included directly in INSERT statement |
| 5 | **CRITICAL** | All 30 UPDATE statements for quizzes also truncated — quiz questions can't be populated | Eliminated UPDATE approach; all quiz JSON inline in INSERT |
| 6 | **CRITICAL** | Lab 3 Band A content truncated mid-INSERT: `(3,'How AI Brains Work ','lab3-lesson-a'...` cuts off | Full content generated for all items |
| 7 | **CRITICAL** | Lab 3 Fact B has broken SQL: `','lab3-fact-b','spark_fact','B','intermediate','# The 2017 paper ''Attent\n(3,'Attention Paper ON CONFLICT` — two statements merged | Each INSERT is a complete, independent statement |
| 8 | **HIGH** | Only 1 lesson per lab per band (source: 30 total) vs 5 required (spec: 150 total) | Generated 5 lessons per lab per band |
| 9 | **HIGH** | Only 1 quiz per lab per band (source: 30 total) vs 3 required (spec: 90 total) | Generated 3 quizzes per lab per band, each with 5 questions |
| 10 | **HIGH** | Only 2 spark facts per lab (Bands A+B only, 20 total) vs 6 required (2 per band, 60 total) | Generated 2 facts per band per lab including Band C |
| 11 | **HIGH** | Each quiz had only truncated question text — no valid JSON array | All 90 quizzes have complete JSON: 5 questions, 4 options, correct_index, explanation, hint |
| 12 | **HIGH** | `ON CONFLICT (slug) DO NOTHING` placed after grouped multi-row INSERT — incorrect syntax | Each INSERT is single-row with proper semicolon termination; wrapped in BEGIN/COMMIT transaction |
| 13 | **HIGH** | Source doc used 2 SQL files (`seed-content-full.sql` + `seed-quizzes-full.sql`) | Consolidated into single `sql/stage9-seed-content.sql` — simpler, atomic, no ordering dependency |
| 14 | **MEDIUM** | Missing `estimated_minutes` in some truncated INSERTs — column not populated | All 300 items have `estimated_minutes` set per band guidelines |
| 15 | **MEDIUM** | `sort_order` set to 10 for all items — no within-band ordering | Sort order set: lessons 1-5, quizzes 6-8, facts 9-10 within each lab+band |
| 16 | **MEDIUM** | Verification queries reference wrong expected counts (80 instead of 300) | Updated verification queries with correct expected totals |
| 17 | **MEDIUM** | Step 5 uses `git push origin main` — should use feature branch | Corrected to use current development branch |
| 18 | **LOW** | Missing `published_at` in some truncated INSERTs | All items include `published_at: now()` |
| 19 | **LOW** | UTF-8 encoding issues in generated content (mojibake characters) | All non-ASCII characters cleaned to safe ASCII equivalents |

### Enhancement Suggestions (All Implemented Below)

| # | Category | Enhancement | Rationale |
|---|----------|-------------|-----------|
| 1 | **Content Depth** | 5 lessons per band per lab instead of 1 | Progressive learning: intro → concepts → hands-on → deep dive → synthesis |
| 2 | **Quiz Variety** | 3 quizzes per band per lab instead of 1 | Covers broader topic range per lab; reduces repetition |
| 3 | **Band C Facts** | Spark facts for Band C (not just A+B) | Older students deserve fun facts too — provides quick XP wins for all ages |
| 4 | **Inline Quiz JSON** | Quiz questions in INSERT instead of UPDATE | Atomic: single SQL statement per item; no ordering dependency |
| 5 | **Transaction Safety** | BEGIN/COMMIT wrapper around all INSERTs | All-or-nothing: either all 300 items insert or none do |
| 6 | **Seed Utility** | TypeScript script for connection validation | Admins can verify Supabase connectivity before running large SQL |
| 7 | **Markdown Quality** | All lessons use proper markdown: headings, bold, lists | Renders correctly in SparkForge's lesson display component |

### Relationship to Existing Seed Content

Stage 2 created `sql/003_seed_content.sql` with 6 starter items (4 lessons, 1 quiz, 1 fact for Labs 1-3). This Part 3 seed file is **additive** — all slugs are unique and won't conflict with Stage 2 content. Both seed files can run independently.

---

## STEP 1: CREATE SEED SQL FILE

> **HARD STOP (HS-7 style):** After creating this file, run it in the Supabase SQL Editor. Alternatively, use the TypeScript seed utility in Step 2 to verify connectivity first.

### File 1: `sql/stage9-seed-content.sql`

**WHERE:** Create at `sql/stage9-seed-content.sql`
**SIZE:** ~650KB, 9,265 lines, 300 INSERT statements
**INSTRUCTIONS:** Copy and paste into Supabase SQL Editor, or run via Supabase CLI

The file is structured as follows:

```sql
-- ════════════════════════════════════════════════════════════════════════
-- SPARKFORGE SEED CONTENT — 300 Items (150 Lessons + 90 Quizzes + 60 Facts)
-- Stage 9 Part 3 (9C) — Run after 003_seed_content.sql
--
-- Distribution: 10 Labs × 3 Bands × (5 lessons + 3 quizzes + 2 facts) = 300
-- Uses ON CONFLICT (slug) DO NOTHING to safely skip existing Stage 2 items
-- ════════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══ LAB 1: WHAT AI IS, EVERYDAY AI, HISTORY OF AI, AI VS HUMANS ═══
-- Band A Lessons (5 items, sort_order 1-5)
-- Band A Quizzes (3 items, sort_order 6-8, 5 questions each)
-- Band A Spark Facts (2 items, sort_order 9-10)
-- Band B Lessons ...
-- Band B Quizzes ...
-- Band B Spark Facts ...
-- Band C Lessons ...
-- Band C Quizzes ...
-- Band C Spark Facts ...

-- ═══ LAB 2: MACHINE LEARNING ═══
-- [Same structure repeats for each lab]

-- ... through LAB 10 ...

COMMIT;

-- ════════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES
-- ════════════════════════════════════════════════════════════════════════
SELECT type, COUNT(*) FROM content WHERE status = 'published' GROUP BY type ORDER BY type;
-- Expected: lesson ~153, quiz ~91, spark_fact ~61 (includes Stage 2 starter items)
```

**NOTE:** The full SQL file (`sql/stage9-seed-content.sql`) is 9,265 lines and is included in the repository. It is too large to embed inline in this stage document. The file was generated, validated, and committed alongside this document.

### Content Per Lab Per Band

Each lab follows this internal structure per age band:

| Sort Order | Type | is_free | Description |
|-----------|------|---------|-------------|
| 1 | lesson | true | Introduction / overview |
| 2 | lesson | false | Core concepts |
| 3 | lesson | false | Hands-on / practical |
| 4 | lesson | false | Deep dive |
| 5 | lesson | false | Synthesis / connections |
| 6 | quiz | true | Basics quiz (5 questions) |
| 7 | quiz | false | Concepts quiz (5 questions) |
| 8 | quiz | false | Advanced quiz (5 questions) |
| 9 | spark_fact | true | Fun fact #1 |
| 10 | spark_fact | true | Fun fact #2 |

### Lesson Content Format

Every lesson uses markdown with consistent structure:

```markdown
# Lesson Title

Introduction paragraph with **bold key terms**.

## Section 1
- Bullet point explanations
- Real-world examples

## Section 2
More content with age-appropriate language.

## Key Takeaway
Summary of what was learned.
```

### Quiz Question Format

Every quiz has exactly 5 questions as JSONB:

```json
[
  {
    "question": "What does AI stand for?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_index": 1,
    "explanation": "Positive explanation of the correct answer.",
    "hint": "A helpful hint without giving away the answer."
  }
]
```

---

## STEP 2: CREATE TYPESCRIPT SEED UTILITY

### File 2: `src/lib/agent/seed.ts`

**WHERE:** Create at `src/lib/agent/seed.ts`
**PURPOSE:** Validates Supabase connectivity and displays content statistics. The SQL file remains the primary seeding mechanism.

```typescript
// ════════════════════════════════════════════════════
// SEED CONTENT SCRIPT — Programmatic alternative to SQL
// Usage: npx tsx src/lib/agent/seed.ts
// Requires: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
// ════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local'
  );
  console.error('Set these environment variables before running the seed script.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
  console.log('SparkForge Content Seed Script');
  console.log('==============================');
  console.log('Target: 150 lessons + 90 quizzes + 60 spark facts = 300 items\n');

  // Check connection and existing content
  const { count, error: countError } = await supabase
    .from('content')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Failed to connect to Supabase:', countError.message);
    console.error('\nMake sure your Supabase project is running and credentials are correct.');
    process.exit(1);
  }

  console.log(`Current content count: ${count ?? 0} items`);

  // Read the SQL file
  const sqlPath = path.join(process.cwd(), 'sql', 'stage9-seed-content.sql');

  if (!fs.existsSync(sqlPath)) {
    console.error(`SQL file not found at: ${sqlPath}`);
    console.error('Make sure sql/stage9-seed-content.sql exists.');
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
  const insertCount = (sqlContent.match(/INSERT INTO/g) || []).length;

  console.log(`\nSQL file contains ${insertCount} INSERT statements.`);
  console.log('\nTo seed the database, run this SQL file in your Supabase SQL Editor:');
  console.log(`  File: ${sqlPath}`);
  console.log('\nAlternatively, use the Supabase CLI:');
  console.log('  supabase db reset  (if using local development)');
  console.log('  or paste the SQL directly into the Supabase Dashboard SQL Editor');

  // Verify current distribution
  const { data: stats } = await supabase
    .from('content')
    .select('type, target_age_band, world');

  if (stats && stats.length > 0) {
    const byType: Record<string, number> = {};
    const byLab: Record<number, number> = {};

    for (const item of stats) {
      byType[item.type] = (byType[item.type] || 0) + 1;
      byLab[item.world] = (byLab[item.world] || 0) + 1;
    }

    console.log('\nCurrent content distribution:');
    console.log('  By type:', byType);
    console.log('  By lab:', byLab);
  }

  console.log('\nSeed script complete.');
}

seed().catch((err) => {
  console.error('Seed script failed:', err);
  process.exit(1);
});
```

---

## STEP 3: VERIFY SEED DATA

After running `sql/stage9-seed-content.sql` in Supabase SQL Editor, run these verification queries:

### 3.1 Total Published Content

```sql
SELECT count(*) FROM content WHERE status = 'published';
-- Expected: 306 (300 new + 6 from Stage 2 starter)
```

### 3.2 Content Per Type

```sql
SELECT type, COUNT(*) FROM content WHERE status = 'published' GROUP BY type ORDER BY type;
-- Expected:
--   lesson: 154 (150 new + 4 from Stage 2)
--   quiz: 91 (90 new + 1 from Stage 2)
--   spark_fact: 61 (60 new + 1 from Stage 2)
```

### 3.3 Content Per Lab

```sql
SELECT world AS lab, COUNT(*) FROM content WHERE status = 'published'
GROUP BY world ORDER BY world;
-- Expected: ~30 per lab (Labs 1-3 may have +1-2 from Stage 2 starter)
```

### 3.4 Content Per Band

```sql
SELECT target_age_band, COUNT(*) FROM content WHERE status = 'published'
GROUP BY target_age_band ORDER BY target_age_band;
-- Expected: A ~102, B ~102, C ~102 (evenly distributed)
```

### 3.5 Quizzes With Questions

```sql
SELECT count(*) FROM content WHERE quiz_questions IS NOT NULL;
-- Expected: 91 (90 new + 1 from Stage 2)
```

### 3.6 Free vs Gated Content

```sql
SELECT is_free, COUNT(*) FROM content WHERE status = 'published' GROUP BY is_free;
-- Expected: true ~186 (first lesson + first quiz per band + all facts), false ~120
```

### 3.7 No Duplicate Slugs

```sql
SELECT slug, COUNT(*) FROM content GROUP BY slug HAVING COUNT(*) > 1;
-- Expected: 0 rows (no duplicates)
```

---

## STEP 4: FULL STAGE 9 VALIDATION CHECKLIST

### Build Validation

```bash
npm run build
npx tsc --noEmit
```

### Schema (Part 1)

- [ ] `sql/schema-stage9.sql` runs cleanly
- [ ] `agent_runs` table exists with columns: `id`, `run_id`, `findings_count`, `generated_count`, `approved_count`, `flagged_count`, `rejected_count`, `errors`, `created_at`, `completed_at`, `duration_ms`
- [ ] `content_queue` has indexes on `status`, `generated_at`, `world`

### Seed Data (Part 3)

- [ ] `sql/stage9-seed-content.sql` runs cleanly in Supabase SQL Editor
- [ ] 300+ published content items (306 including Stage 2 starter)
- [ ] 90+ quizzes have `quiz_questions` populated with valid JSON
- [ ] All 10 labs have content (~30 items each)
- [ ] All 3 bands have content (~100 items each)
- [ ] Free content accessible: first lesson + first quiz per band + all facts
- [ ] Gated content requires Plus/Forge subscription

### Agent Pipeline (Part 1)

- [ ] `POST /api/agent/run` without API key returns 503 with setup URL
- [ ] `POST /api/agent/run` as non-admin returns 403
- [ ] `GET /api/agent/schedule` without `CRON_SECRET` returns 401
- [ ] `GET /api/agent/schedule` without API key returns 200 (skipped)
- [ ] With API key + admin: `POST /api/agent/run` returns `AgentRunResult`

### Admin Dashboard (Part 2)

- [ ] `/admin/content` loads for admin users
- [ ] Non-admin users are blocked
- [ ] "Run Agent Now" triggers pipeline
- [ ] Stats bar shows counts (pending, approved, rejected, flagged)
- [ ] Filter tabs work (pending / flagged / approved / rejected)
- [ ] Checkboxes toggle + select-all works
- [ ] Bulk approve moves items from `content_queue` to `content` table
- [ ] Bulk reject with reason dialog
- [ ] Preview modal shows: title, safety check, content body, quiz questions
- [ ] Run History tab shows past `agent_runs` with stats + duration

### Content Display

- [ ] Lab 1-3 free content visible for Free tier users
- [ ] Lab 4-10 content gated behind Plus/Forge subscription
- [ ] Lessons render markdown correctly
- [ ] Quizzes display with selectable options and scoring
- [ ] Spark facts display as quick-read cards with XP reward

---

## STEP 5: GIT COMMIT

```bash
git add sql/stage9-seed-content.sql src/lib/agent/seed.ts
git commit -m "Stage 9 Part 3: Seed content — 150 lessons, 90 quizzes, 60 spark facts (300 items)"
```

---

## Content Summary by Lab

### Lab 1: What IS AI?
- **Band A:** AI basics through everyday examples (Siri, Alexa, games), fun analogies about teaching puppies
- **Band B:** Machine learning introduction, pattern recognition, history from Turing Test to modern AI
- **Band C:** Formal definitions, narrow vs general AI, Turing Test analysis, computational theory foundations

### Lab 2: Teaching Machines
- **Band A:** Training AI like teaching a puppy, sorting pictures game analogy, why data matters
- **Band B:** Supervised vs unsupervised learning, training/test data splits, overfitting concepts
- **Band C:** Mathematical foundations of ML, gradient descent, bias-variance tradeoff, cross-validation

### Lab 3: Neural Networks
- **Band A:** Brain-like computers, neurons as tiny decision-makers, layers as assembly lines
- **Band B:** Layers and weights, activation functions with analogies, how CNNs work
- **Band C:** Backpropagation mathematics, CNN/RNN/Transformer architectures, attention mechanism

### Lab 4: Generative AI
- **Band A:** AI that creates pictures and stories, fun examples of AI art, what tokens are
- **Band B:** How LLMs work (tokens, context windows), prompt crafting, image generation basics
- **Band C:** Transformer attention mechanism, diffusion models, RLHF, emergence in large models

### Lab 5: AI Agents
- **Band A:** Robot helpers that make plans, AI assistants that use tools, step-by-step thinking
- **Band B:** Agent loops (observe-think-act), tool use patterns, multi-step planning
- **Band C:** ReAct framework, function calling, autonomous agent architectures, safety constraints

### Lab 6: AI Ethics
- **Band A:** Fairness in AI, why AI needs rules, being kind with technology, deepfake awareness
- **Band B:** Bias in datasets, facial recognition concerns, privacy, responsible AI development
- **Band C:** Algorithmic fairness metrics, regulatory frameworks (EU AI Act), societal impact analysis

### Lab 7: Computer Vision
- **Band A:** How computers see pictures, what pixels are, fun filters, pattern matching
- **Band B:** Image classification, object detection, how face filters work, CNN fundamentals
- **Band C:** Feature extraction, YOLO/R-CNN architectures, Vision Transformers, multimodal models

### Lab 8: Language & NLP
- **Band A:** Teaching computers to read feelings, happy/sad/angry text, translation magic
- **Band B:** Tokenization, chatbot design principles, translation AI, text summarization
- **Band C:** Attention mechanisms, BERT/GPT architectures, word embeddings, few-shot learning

### Lab 9: Coding with AI
- **Band A:** Giving computers instructions like recipes, what APIs are (restaurant menu analogy)
- **Band B:** Prompt engineering techniques, API basics, building simple AI-powered apps
- **Band C:** REST APIs, SDK integration, system prompts, production deployment considerations

### Lab 10: AI Futures
- **Band A:** Cool jobs working with AI, robots of the future, AI helping solve big problems
- **Band B:** AI career paths, emerging capabilities, AI in healthcare/climate/education
- **Band C:** AGI debate, governance frameworks, alignment research, societal transformation

---

## PART 3 (9C) COMPLETE!

### Files Created

| File | Size | Items |
|------|------|-------|
| `sql/stage9-seed-content.sql` | ~650KB, 9,265 lines | 300 INSERT statements |
| `src/lib/agent/seed.ts` | ~2KB | Utility script |

### Content Breakdown

| Metric | Count |
|--------|-------|
| Total items | 300 |
| Lessons | 150 (5 per lab per band) |
| Quizzes | 90 (3 per lab per band, 5 questions each) |
| Spark Facts | 60 (2 per lab per band) |
| Total quiz questions | 450 (90 quizzes × 5 questions) |
| Labs covered | 10 (all) |
| Age bands covered | 3 (A, B, C — all) |
| Free items | ~186 (first lesson + quiz per band + all facts) |
| Gated items | ~114 (remaining lessons + quizzes) |

### Enhancement Applied

| ID | Enhancement | Impact |
|----|-------------|--------|
| ENH-9D | Complete 10-lab seed (source had only Labs 1-3) | All labs have day-one content |
| ENH-9E | Inline quiz JSONB (source used UPDATE) | Single atomic INSERT per item |
| ENH-9F | Per-band free tier gating | Each band gets free samples |

---

## ═══ STAGE 9 v2 COMPLETE — ALL 3 PARTS ═══

### Total Files Across Parts 1-3

**Part 1 (9A): 8 files**
- `src/lib/agent/prompts.ts` — System prompts, `MODELS` config, `WORLD_TOPICS`, `SEARCH_QUERIES`
- `src/lib/agent/readability.ts` — Flesch-Kincaid readability scoring + age band validation
- `src/lib/agent/pipeline.ts` — 4-stage orchestrator, `approveContent`, `rejectContent`, retry logic
- `src/app/api/agent/run/route.ts` — Manual trigger (admin-only, POST)
- `src/app/api/agent/schedule/route.ts` — Vercel cron trigger (GET, `CRON_SECRET` protected)
- `src/app/api/agent/review/route.ts` — Approve/reject queue items (admin-only, bulk support)
- `sql/schema-stage9.sql` — `agent_runs` table, indexes, RLS
- `vercel.json` — Daily cron at 6 AM UTC

**Part 2 (9B): 2 files**
- `src/app/api/agent/review/route.ts` (REPLACE — adds GET handler)
- `src/app/(dashboard)/admin/content/page.tsx` — Admin review dashboard

**Part 3 (9C): 2 files**
- `sql/stage9-seed-content.sql` — 300 seed content items
- `src/lib/agent/seed.ts` — Seed utility script

**GRAND TOTAL: 11 unique files**

### Bug Fixes Applied

| ID | Fix |
|----|-----|
| BUG-9A | Lazy Anthropic SDK init — no top-level crash if key missing |
| BUG-9B | Centralized `MODELS` config — one place to update model strings |
| BUG-9C | Proper `approveContent()` unpacker for `content_queue` to `content` migration |

### Enhancements Applied

| ID | Enhancement |
|----|-------------|
| ENH-9A | Graceful 503 if `ANTHROPIC_API_KEY` missing |
| ENH-9B | Run History tab with `agent_runs` stats display |
| ENH-9C | Bulk approve/reject with select-all checkbox |
| ENH-9D | Full 10-lab seed SQL (300 items vs source doc's 80) |
| ENH-9E | Inline quiz JSONB in INSERT statements |
| ENH-9F | Per-band free tier gating strategy |

### NEXT STAGE: Stage 10 (Polish, Accessibility & Deployment)

---

*End of Stage 9 Part 3 — STAGE9_Content_Agent_v2_PART3.md*
*300 seed content items | 10 Labs | 3 age bands | 450 quiz questions | March 11, 2026*
