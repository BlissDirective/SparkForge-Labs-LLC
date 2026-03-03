# SparkForge Agent: Autonomous Evaluation and Improvement Playbook

**Version:** 1.0 | **Date:** March 3, 2026
**Companion to:** CLAUDE.md v5.2 (extends, does not replace)

---

## Table of Contents

1. Purpose and Scope
2. How This Relates to CLAUDE.md
3. Trigger Points (When to Run)
4. Evaluation Categories
5. Severity Levels
6. The Evaluation Sweep Process
7. Admin Approval Workflow
8. The Apply-Test-Report Cycle
9. Content Evaluation and Suggestions
10. Agent Report Template
11. Supporting Scripts and Tooling
12. Limitations and Boundaries
13. Quick Reference Card

---

## 1. Purpose and Scope

The SparkForge Agent is an **evaluation and improvement protocol** for Claude Code. When triggered, it performs a structured sweep of the entire SparkForge codebase, analyzes findings against project standards, presents a categorized report to the admin (you), waits for approval, applies approved changes, tests the results, and reports back.

### What the Agent Does

- Runs automated health checks (build, TypeScript, lint)
- Detects code quality issues, security vulnerabilities, and convention violations
- Cross-references stage documents against actual source code for drift
- Validates PROGRESS.md accuracy against reality
- Checks database schemas, Zod validations, and RLS patterns for consistency
- Verifies frontend component conventions and accessibility
- Audits backend API routes for validation, error handling, and rate limiting
- Evaluates game content completeness and suggests educational improvements
- Generates a structured report with severity-ranked findings
- Applies approved changes with post-change verification

### What the Agent Does NOT Do

- Run as a persistent background daemon (see Section 12)
- Apply any changes without explicit admin approval
- Access production environments or live databases
- Replace the CLAUDE.md build workflow (it evaluates what was built)
- Override locked architectural decisions (48 decisions in `docs/01-decisions/`)

---

## 2. How This Relates to CLAUDE.md

CLAUDE.md governs **building** SparkForge stage-by-stage. This document governs **evaluating and improving** what has been built. They work together without conflict.

| Concern | CLAUDE.md Governs | SparkForge Agent Governs |
|---------|-------------------|--------------------------|
| Building new code | Stage documents, per-part workflow | -- |
| Fixing build errors during build | Section 10 auto-fix guide | -- |
| Evaluating existing code quality | -- | Evaluation sweep (Section 6) |
| Suggesting improvements | -- | Findings report (Section 10) |
| Modifying stage docs | Section 3.1 modification policy | Agent can flag doc drift |
| Applying changes | Autonomy rules (Section 2) | Admin approval workflow (Section 7) |
| Progress tracking | PROGRESS.md updates | Progress accuracy validation |

### Rule: CLAUDE.md Takes Precedence

If this document and CLAUDE.md ever conflict, **CLAUDE.md wins**. Specifically:
- CLAUDE.md HARD STOPS still apply during agent operations
- CLAUDE.md autonomy boundaries still govern what can be done without asking
- Locked decisions (48) cannot be changed by agent recommendations
- Stage build order cannot be resequenced by agent suggestions

---

## 3. Trigger Points (When to Run)

The agent runs at **stage boundaries** and **on demand**.

### Stage-Boundary Evaluation (Automatic)

After completing ALL parts of a stage and BEFORE triggering HS-5 (Visual Checkpoint), run a full evaluation sweep. This catches issues before the human reviews visually.

```
[Complete Stage N, all parts]
        |
        v
[AGENT: Full evaluation sweep]
        |
        v
[Generate AGENT-REPORT.md]
        |
        v
[Present findings to admin]
        |
        v
[Admin approves/rejects per category]
        |
        v
[Apply approved changes + verify]
        |
        v
[HS-5: Visual Checkpoint (existing CLAUDE.md flow)]
```

### On-Demand Evaluation (Human-Triggered)

The admin can trigger an evaluation at any time by saying:

| Command | Sweep Type | What It Does |
|---------|-----------|-------------|
| "Run agent evaluation" | Full sweep | All 8 evaluation categories, full report |
| "Run agent quick check" | Quick sweep | Build + TypeScript + lint only, minimal report |
| "Run agent check on [category]" | Targeted sweep | Single category (e.g., "check security", "check content") |
| "Run agent check on [file/dir]" | Scoped sweep | Evaluate specific files or directories |

### What Triggers What

| Trigger | Categories Evaluated | Expected Duration |
|---------|---------------------|-------------------|
| Quick check | Build Health only | 1-2 minutes |
| Targeted sweep | One specific category | 2-5 minutes |
| Full sweep | All 8 categories | 5-15 minutes |
| Stage-boundary | All 8 categories + content | 10-20 minutes |

---

## 4. Evaluation Categories

### Category 1: Build Health

**What it checks:** Can the project compile and pass static analysis?

| Check | Command | Pass Criteria |
|-------|---------|---------------|
| Production build | `npm run build` | Exit code 0, no errors |
| TypeScript strict | `npx tsc --noEmit` | Zero errors |
| ESLint | `npm run lint` | Zero errors (warnings logged) |
| Package audit | `npm audit --production` | No critical/high vulnerabilities |

**Auto-fix eligible:** Yes (per CLAUDE.md Section 10 patterns)

### Category 2: Code Quality

**What it checks:** Does the code follow SparkForge conventions and best practices?

| Check | Method | What to Look For |
|-------|--------|-----------------|
| Naming conventions | File scan | Components: PascalCase, hooks: usePrefix, stores: camelCase, 3D: in `src/components/3d/` |
| Dead code | Import analysis | Unused exports, unreachable code, commented-out blocks |
| Type safety | Pattern matching | `any` usage, missing return types on public functions, `@ts-ignore` comments |
| Error handling | API route scan | All routes have try/catch, meaningful error responses, no leaked stack traces |
| Store consistency | Cross-reference | Store shapes match TypeScript interfaces in `types/index.ts` |
| Hook patterns | File scan | Hooks follow rules-of-hooks, no conditional hook calls |

**What to report:**
```
[CODE-QUALITY] HIGH: src/app/api/content/route.ts:45 — Missing try/catch around Supabase query
[CODE-QUALITY] MEDIUM: src/hooks/useApi.ts — 3 functions exported but never imported anywhere
[CODE-QUALITY] LOW: src/stores/childStore.ts:12 — `any` type used for cosmetics parameter
```

### Category 3: Stage Alignment

**What it checks:** Do stage documents match the actual codebase?

| Check | Method | What to Look For |
|-------|--------|-----------------|
| File existence | Compare stage doc file lists vs `src/` contents | Files in doc but missing from codebase |
| File drift | Compare code in stage doc vs actual file contents | Significant divergence after auto-fixes |
| Stage completion | Cross-reference PROGRESS.md | Claimed-complete stages that have missing files |
| Import consistency | Trace imports across stages | Stage N references files from Stage N+1 (forward reference) |

**Stage doc scan process:**
1. Read the stage document for the current/latest completed stage
2. Extract all file paths and expected exports
3. Verify each file exists and exports match
4. Flag any files that exist in the codebase but are NOT in any stage document (orphans)
5. Flag any files in stage documents that do not exist in the codebase (gaps)

### Category 4: Progress Accuracy

**What it checks:** Does PROGRESS.md reflect the true state of the project?

| Check | Method | What to Look For |
|-------|--------|-----------------|
| Phase status | Compare claimed status vs git history | Phases marked complete but no matching commit |
| Build metrics | Re-run build, compare times/error counts | Metrics outdated |
| Soft stop log | Compare logged fixes vs actual file state | Fixes logged but not actually applied |
| Discrepancy log | Verify resolutions are still accurate | Recorded discrepancies that were later overwritten |
| Hard stop status | Check env requirements | Hard stops resolved but env vars missing |

### Category 5: Database Integrity

**What it checks:** Are database-related patterns consistent and secure?

| Check | Method | What to Look For |
|-------|--------|-----------------|
| Zod schemas | Cross-reference `lib/validations.ts` vs `types/index.ts` | Zod shapes match TypeScript interfaces |
| API validation | Scan all API routes | Every POST/PUT route uses Zod `.parse()` or `.safeParse()` |
| Supabase client usage | Pattern scan | No service role key usage in client-side code |
| World/Lab terminology | Full codebase scan | Database queries use `world`, UI text uses "Lab" |
| Column references | Cross-reference SQL docs vs Supabase queries | Queries reference columns that exist in schema |

### Category 6: Frontend Health

**What it checks:** Do frontend components follow SparkForge conventions?

| Check | Method | What to Look For |
|-------|--------|-----------------|
| 3D component pattern | Scan `src/components/3d/` | All use `dynamic(() => import(...), { ssr: false })`, all have `useIsMobile()` fallback |
| Game architecture | Scan `src/components/games/` | All games have Phase type, age band support, GameShell wrapper, completeGame() call |
| Accessibility | Pattern scan | ARIA labels on interactive elements, keyboard navigation, focus management |
| Design system | CSS/class scan | Colors match Frost-Prismatic palette, fonts are Exo 2/Sora/Orbitron (not Fredoka/Nunito) |
| Component exports | Import trace | Every component has a default export, no circular imports |
| Loading states | Pattern scan | Async components have loading/error states |

### Category 7: Backend Health

**What it checks:** Are API routes robust and secure?

| Check | Method | What to Look For |
|-------|--------|-----------------|
| Auth checks | Scan all protected routes | Dashboard/API routes verify auth before processing |
| Rate limiting | Cross-reference `lib/rate-limit.ts` usage | Sensitive endpoints (auth, payment) have rate limiting |
| Error responses | Pattern scan | Consistent error format, no stack traces in production |
| Input validation | Every route | All user input validated with Zod before use |
| CORS/CSP | Config scan | Security headers configured in `next.config.js` |
| Env var safety | Full scan | No hardcoded secrets, no env vars in client-side code without `NEXT_PUBLIC_` prefix |

### Category 8: Content Completeness

**What it checks:** Is all game and educational content accounted for?

| Check | Method | What to Look For |
|-------|--------|-----------------|
| Game registry | Cross-reference `gameRegistry.ts` vs game component files | All 35 games listed and have matching components |
| Age band coverage | Scan game components | Each game supports its required age bands (A/B/C per GCUD) |
| Game phases | Scan game components | Every game has welcome/learn/play/complete phases |
| Lab assignment | Cross-reference GCUD | Each game assigned to correct lab (1-10) |
| Content seeding | Check seed files | Badge definitions (68), starter content present |

---

## 5. Severity Levels

| Level | Meaning | Action | Example |
|-------|---------|--------|---------|
| **CRITICAL** | App is broken or has a security vulnerability | Must fix before proceeding | Build fails, exposed API key, auth bypass |
| **HIGH** | Significant issue that will cause problems | Should fix in current session | Missing Zod validation on POST route, type mismatch in store, broken import |
| **MEDIUM** | Convention violation or quality issue | Fix when convenient | Missing ARIA label, inconsistent naming, missing loading state |
| **LOW** | Minor improvement opportunity | Optional, consider fixing | Code style inconsistency, minor optimization, verbose code |
| **INFO** | Observation or suggestion | No action required | Content idea, architecture note, future improvement |

### Severity Distribution Expectations

A healthy codebase after a completed stage should have:
- CRITICAL: 0 (any means the build is broken)
- HIGH: 0-3 (each should be addressed)
- MEDIUM: 5-15 (normal, address over time)
- LOW: 10-30 (expected, optional fixes)
- INFO: 5-20 (observations and ideas)

---

## 6. The Evaluation Sweep Process

### Phase 1: SCAN (Automated Checks)

Run all automated tooling first. These are fast and objective.

```bash
# Step 1: Build check
npm run build 2>&1

# Step 2: TypeScript strict check
npx tsc --noEmit 2>&1

# Step 3: Lint check
npm run lint 2>&1

# Step 4: Package audit
npm audit --production 2>&1
```

Record pass/fail for each. If build fails, that is an immediate CRITICAL finding.

### Phase 2: ANALYZE (Pattern-Based Evaluation)

Read files and cross-reference patterns. Work through categories 2-8 systematically.

**Analysis order (dependencies):**
1. Types and interfaces (`types/index.ts`) — Everything references these
2. Stores (`stores/*.ts`) — Components depend on store shapes
3. Utilities (`lib/*.ts`) — Shared code used everywhere
4. API routes (`app/api/`) — Backend before frontend
5. Components (`components/`) — Depend on all of the above
6. Pages (`app/`) — Depend on components
7. Stage documents (`docs/`) — Cross-reference against all of the above
8. Content and game files — Final check

**For each file analyzed, check:**
- Does it compile? (already covered by Phase 1)
- Does it follow naming conventions?
- Are imports valid and used?
- Are exports consumed by other files?
- Does it handle errors appropriately?
- Does it match its stage document specification?

### Phase 3: REPORT (Generate Findings)

Compile all findings into `AGENT-REPORT.md` using the template in Section 10.

**Report generation rules:**
- Group findings by category
- Sort within each category by severity (CRITICAL first)
- Include file path, line number, and specific description for each finding
- Include a proposed fix for every HIGH and CRITICAL finding
- Include summary statistics at the top

### Phase 4: APPROVE (Present to Admin)

Present the report summary to the admin with category-level approval.

```
SPARKFORGE AGENT EVALUATION COMPLETE

Sweep type: Full (stage-boundary)
Stage evaluated: Stage 3
Duration: 8 minutes
Findings: 47 total

  CRITICAL:  0
  HIGH:      2  (Code Quality: 1, Backend Health: 1)
  MEDIUM:    12 (Frontend: 4, Backend: 3, Stage Alignment: 3, Content: 2)
  LOW:       18
  INFO:      15

Full report: AGENT-REPORT.md

APPROVAL REQUIRED — Please review by category:

  1. Build Health (0 findings) .............. AUTO-PASS
  2. Code Quality (8 findings, 1 HIGH) ...... NEEDS REVIEW
  3. Stage Alignment (5 findings) ........... NEEDS REVIEW
  4. Progress Accuracy (2 findings) ......... NEEDS REVIEW
  5. Database Integrity (3 findings) ........ NEEDS REVIEW
  6. Frontend Health (9 findings) ........... NEEDS REVIEW
  7. Backend Health (7 findings, 1 HIGH) .... NEEDS REVIEW
  8. Content Completeness (13 findings) ..... NEEDS REVIEW

Commands:
  "approve all"              — Apply all proposed fixes
  "approve [1,2,5]"          — Approve specific categories by number
  "reject [3]"               — Reject specific categories
  "show [category]"          — View detailed findings for a category
  "show HIGH"                — View all HIGH severity findings
  "approve all except [8]"   — Approve everything except a category
  "skip"                     — Skip all changes, keep report for reference
```

### Phase 5: APPLY (Make Changes)

For each approved category:
1. Apply changes one file at a time
2. After each file change, verify the file is syntactically valid
3. Log each change in AGENT-REPORT.md under "Applied Changes"

**Order of application:**
1. CRITICAL fixes first (if any)
2. HIGH fixes
3. MEDIUM fixes
4. LOW fixes

**Conflict handling:**
- If two findings affect the same file, apply them in line-number order (top to bottom)
- If one fix invalidates another, skip the second and log it

### Phase 6: VERIFY (Test After Changes)

After all approved changes are applied:

```bash
# Step 1: Rebuild
npm run build

# Step 2: TypeScript check
npx tsc --noEmit

# Step 3: Lint
npm run lint

# Step 4: Run tests (if test infrastructure exists)
npm test 2>/dev/null || echo "No test script configured"
```

Report results:

```
SPARKFORGE AGENT — VERIFICATION COMPLETE

Changes applied: 23 of 47 findings (approved categories: 1,2,4,5,6,7)
Changes skipped: 24 (category 3 rejected, category 8 skipped)

Post-change verification:
  Build:      PASS
  TypeScript: PASS
  Lint:       PASS (2 new warnings, non-blocking)
  Tests:      SKIPPED (no test script)

Regressions detected: 0

All changes committed: [commit hash]
AGENT-REPORT.md updated with results.
```

---

## 7. Admin Approval Workflow

### Approval Granularity: Per-Category

Findings are grouped into 8 categories (Section 4). The admin approves or rejects entire categories, not individual items.

### Approval Commands

| Command | Effect |
|---------|--------|
| `approve all` | Apply fixes for all categories |
| `approve [2,5,7]` | Apply fixes for categories 2, 5, and 7 only |
| `reject [3,8]` | Explicitly reject categories 3 and 8 |
| `approve all except [8]` | Shorthand for approving everything except one category |
| `show [category name or number]` | Display detailed findings before deciding |
| `show HIGH` or `show CRITICAL` | Display all findings of that severity |
| `skip` | Keep the report but apply nothing |
| `defer [4]` | Mark category for next evaluation (not rejected, just postponed) |

### Partial Approval Flow

```
Admin: "approve [1,2,5,7], reject [3], defer [4,6,8]"

Agent response:
  Applying: Build Health, Code Quality, Database Integrity, Backend Health
  Rejected: Stage Alignment (will not apply, findings archived)
  Deferred: Progress Accuracy, Frontend Health, Content (will re-evaluate next sweep)

  Proceeding with 4 approved categories (19 changes)...
```

### What Requires Escalation

Even within an approved category, some changes require additional confirmation:

| Change Type | Why | What Happens |
|-------------|-----|-------------|
| Deleting a file | Destructive, may lose work | Confirm before deleting |
| Modifying a locked decision | Violates CLAUDE.md | Block and explain |
| Changing database schema | Affects data model (CLAUDE.md Section 3.1) | Escalate with STAGE DOC CHANGE REQUEST |
| Adding new dependencies | Affects bundle size and supply chain | List packages and wait for confirmation |
| Modifying env configuration | May break deployment | Confirm before changing |

---

## 8. The Apply-Test-Report Cycle

### Change Application Process

```
For each approved category:
  For each finding (sorted by severity, then file path):
    1. Read the target file
    2. Apply the proposed change
    3. Verify the change was applied correctly
    4. Log: [APPLIED] Category N, Finding N.M — description

After all changes in a category:
    5. Run: npx tsc --noEmit
    6. If TypeScript fails:
       a. Attempt to fix (CLAUDE.md Section 10 auto-fix)
       b. If fix fails after 2 attempts: revert the last change, log as FAILED
    7. Continue to next category

After all categories:
    8. Run: npm run build
    9. Run: npm run lint
    10. Generate verification report
```

### Rollback Procedure

If a change breaks the build and cannot be auto-fixed:

1. Identify which change caused the failure (bisect by reverting most recent)
2. Revert the breaking change
3. Mark finding as `FAILED — [reason]` in AGENT-REPORT.md
4. Continue applying remaining changes
5. Report the failure in the verification summary

**Rollback command (admin can trigger manually):**
```
"rollback last change"     — Undo the most recent applied change
"rollback category [N]"    — Undo all changes from a specific category
"rollback all"             — Undo all agent changes (restore pre-sweep state)
```

The agent creates a git commit before starting the apply phase, so full rollback is always possible via `git revert`.

### Final Report Format

```
SPARKFORGE AGENT — SESSION REPORT

Evaluation: Full sweep (Stage N boundary)
Date: [timestamp]
Duration: [scan] + [apply] + [verify] = [total]

Summary:
  Findings:     47 total (0 CRITICAL, 2 HIGH, 12 MEDIUM, 18 LOW, 15 INFO)
  Approved:     4 categories (19 changes)
  Applied:      18 of 19 (1 failed — see below)
  Rejected:     1 category (5 changes)
  Deferred:     3 categories (23 changes — will re-evaluate next sweep)
  Regressions:  0

Failed Changes:
  [FAILED] Category 2, Finding 2.4 — Removing unused export from useApi.ts
    Reason: Export is used by a dynamic import in game loader (not detectable by static analysis)
    Action: No change applied, finding reclassified as INFO

Verification:
  Build:      PASS
  TypeScript: PASS
  Lint:       PASS
  Tests:      [PASS / FAIL / SKIPPED]

Commit: [hash] "Agent evaluation: Stage N — 18 improvements applied"

Files modified: [list]
PROGRESS.md: Updated with agent evaluation results
AGENT-REPORT.md: Full detailed report archived

Next evaluation: After Stage [N+1] completion
```

---

## 9. Content Evaluation and Suggestions

Beyond code quality, the agent evaluates SparkForge's educational content and game design for completeness and improvement opportunities.

### Content Checks

| Check | Method | What to Look For |
|-------|--------|-----------------|
| Age band coverage | Cross-reference GCUD vs game components | Games missing required age bands |
| Lab balance | Count games per lab | Labs with fewer than 3 games |
| Difficulty progression | Analyze game complexity within each lab | Band A games harder than expected, Band C too easy |
| Content gaps | Compare lesson/quiz/fact counts per lab | Labs with thin content coverage |
| Game phase completeness | Scan game components | Games missing welcome, learn, play, or complete phases |
| Educational scaffolding | Analyze learn phase content | Games where learn phase is placeholder or too short |

### Content Suggestion Format

```
CONTENT SUGGESTION — [Category]

Game: [game name] (Lab [N], Slug: [slug])
Current state: [what exists now]
Suggestion: [specific improvement]
Educational rationale: [why this matters for learning]
Impact: [what changes would be needed]
Priority: [HIGH / MEDIUM / LOW]
```

### Content Suggestion Categories

| Category | Examples |
|----------|---------|
| **Missing content** | Lab 7 has only 3 games, needs another for Band A learners |
| **Age band gaps** | Bias Detective only supports B/C — could Band A get a simplified version? |
| **Learn phase quality** | Neural Builder's learn phase is placeholder text — needs real explanations |
| **Cross-lab connections** | Prompt Lab and Chatbot Builder teach related concepts — could reference each other |
| **Difficulty calibration** | Token Chopper's Band B is as hard as Band C — needs rebalancing |
| **Assessment coverage** | Lab 5 has no quiz content for review |

### Content Suggestions and the Approval Workflow

Content suggestions are always **INFO** or **LOW** severity — they are ideas, not fixes. They appear in Category 8 (Content Completeness) of the agent report.

The admin can:
- **Approve** content suggestions to have the agent create placeholder files or update game components
- **Defer** them for future development
- **Reject** them if they conflict with the educational design intent

Content suggestions that require new game mechanics, new routes, or database changes are escalated as STAGE DOC CHANGE REQUESTs per CLAUDE.md Section 3.1.

---

## 10. Agent Report Template

The agent generates `AGENT-REPORT.md` at the repo root after each evaluation sweep. This file is overwritten on each new sweep (previous reports are preserved in git history).

```markdown
# SparkForge Agent Report

## Sweep Info
- **Type:** [Quick / Targeted / Full / Stage-boundary]
- **Trigger:** [On-demand / Stage N completion]
- **Date:** [timestamp]
- **Scan Duration:** [time]
- **Scope:** [All categories / Specific categories]

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | [N] |
| HIGH     | [N] |
| MEDIUM   | [N] |
| LOW      | [N] |
| INFO     | [N] |
| **Total** | **[N]** |

## Automated Check Results

| Check | Result | Details |
|-------|--------|---------|
| npm run build | PASS/FAIL | [error summary if failed] |
| npx tsc --noEmit | PASS/FAIL | [N errors if failed] |
| npm run lint | PASS/FAIL | [N errors, M warnings] |
| npm audit | PASS/FAIL | [N vulnerabilities] |

---

## Category 1: Build Health

[Findings or "No issues detected."]

## Category 2: Code Quality

### Finding 2.1 — [SHORT DESCRIPTION]
- **Severity:** HIGH
- **File:** src/path/to/file.ts:45
- **Issue:** [Detailed description of what is wrong]
- **Proposed fix:** [Specific code change or action]
- **Status:** [PENDING / APPROVED / APPLIED / REJECTED / FAILED]

### Finding 2.2 — [SHORT DESCRIPTION]
...

## Category 3: Stage Alignment
## Category 4: Progress Accuracy
## Category 5: Database Integrity
## Category 6: Frontend Health
## Category 7: Backend Health
## Category 8: Content Completeness

---

## Applied Changes Log

| # | Category | Finding | File | Change | Result |
|---|----------|---------|------|--------|--------|
| 1 | 2 | 2.1 | src/api/route.ts | Added try/catch | PASS |
| 2 | 2 | 2.3 | src/stores/child.ts | Fixed type annotation | PASS |
| ... | | | | | |

## Verification Results

| Check | Pre-sweep | Post-sweep |
|-------|-----------|------------|
| Build | PASS | PASS |
| TypeScript | PASS | PASS |
| Lint | 3 warnings | 1 warning |

## Deferred Items (Next Sweep)

[List of findings deferred by admin, to be re-evaluated next time]
```

---

## 11. Supporting Scripts and Tooling

### npm Scripts to Add

These scripts support the agent's automated checks. Add to `package.json`:

```json
{
  "scripts": {
    "agent:check": "npm run build && npx tsc --noEmit && npm run lint",
    "agent:typecheck": "npx tsc --noEmit",
    "agent:audit": "npm audit --production"
  }
}
```

### Structure Validation Patterns

The agent uses these file-system checks during evaluation:

**3D Component Convention Check:**
- All files in `src/components/3d/` must end in `3D.tsx` or `3DScene.tsx`
- All must be dynamically imported with `ssr: false` wherever used
- All must include a `useIsMobile()` check

**Game Component Convention Check:**
- All files in `src/components/games/` must end in `Game.tsx`
- All must define `type Phase = 'welcome' | 'learn' | 'play' | 'complete'`
- All must call `game.completeGame()` in the complete phase
- All must read `ageBand` from `useChildStore`

**API Route Convention Check:**
- All POST/PUT routes must import from `lib/validations.ts`
- All routes must return `NextResponse.json()` (not raw `Response`)
- All routes must have error handling that returns appropriate status codes
- No route should expose stack traces in error responses

### Pre-sweep Git Checkpoint

Before applying any changes, the agent creates a safety checkpoint:

```bash
git stash push -m "Agent pre-sweep checkpoint [timestamp]"
# or if working tree is clean:
git tag agent-checkpoint-[timestamp]
```

This ensures full rollback is always possible.

---

## 12. Limitations and Boundaries

### Session-Based Operation

Claude Code runs session-by-session. The SparkForge Agent is NOT a persistent background process. It cannot:
- Watch files for changes in real-time
- Send notifications when issues are detected
- Run on a schedule (no cron)
- Monitor the app while it is running

"Continuous evaluation" means: **every time you start a session or complete a stage, trigger the agent.** Over time, this creates comprehensive coverage.

### Cannot Access Live Systems

The agent works with the local codebase only. It cannot:
- Query the live Supabase database
- Test against the production Vercel deployment
- Verify Stripe webhook delivery
- Check real Anthropic API responses

For these, manual testing or a dedicated CI/CD pipeline (GitHub Actions) is needed.

### Static Analysis Only

The agent reads and analyzes code. It does not run the application in a browser. This means:
- Cannot verify visual rendering (that is what HS-5 visual checkpoints are for)
- Cannot detect hydration mismatches (requires running the app)
- Cannot test user interaction flows (requires Playwright E2E tests)
- Cannot measure actual performance (requires Lighthouse or browser profiling)

### False Positives

Pattern-based checks will sometimes flag code that is correct. Examples:
- An export flagged as "unused" may be consumed by a dynamic import
- A file flagged as "missing" may be intentionally deferred to a later stage
- A convention violation may be an intentional exception documented in a decision lock

The admin approval step exists specifically to catch these. When the admin rejects a finding, the agent logs it to avoid re-flagging in future sweeps.

### Context Window Limits

A full evaluation of a large codebase may approach context limits. The agent manages this by:
- Processing files in batches (not loading the entire codebase at once)
- Prioritizing recently-changed files
- Using targeted checks (grep, glob) instead of reading entire files when possible
- Summarizing findings as it goes rather than holding all analysis in memory

### What Improves Over Time

As more stages are built and more evaluations run:
- The agent learns which findings the admin consistently rejects (reduces noise)
- AGENT-REPORT.md history in git shows trends (are issues increasing or decreasing?)
- Deferred items accumulate and can be batch-addressed
- Content suggestions become more informed as more games exist for comparison

---

## 13. Quick Reference Card

### Trigger Commands

```
"Run agent evaluation"              Full sweep, all categories
"Run agent quick check"             Build + TypeScript + lint only
"Run agent check on security"       Backend Health + Database Integrity
"Run agent check on content"        Content Completeness only
"Run agent check on src/stores/"    Scoped to specific directory
```

### Approval Commands

```
"approve all"                       Apply everything
"approve [1,2,5]"                   Approve by category number
"reject [3]"                        Reject specific categories
"approve all except [8]"            Approve with exclusions
"defer [4,6]"                       Postpone to next sweep
"show [category]"                   View findings before deciding
"show HIGH"                         View by severity
"skip"                              Apply nothing, keep report
```

### Rollback Commands

```
"rollback last change"              Undo most recent applied change
"rollback category [N]"             Undo all changes from a category
"rollback all"                      Restore pre-sweep state
```

### Evaluation Categories

```
1. Build Health          — npm build, tsc, lint, audit
2. Code Quality          — Naming, dead code, types, error handling
3. Stage Alignment       — Docs vs code drift
4. Progress Accuracy     — PROGRESS.md vs reality
5. Database Integrity    — Zod, RLS, Supabase patterns
6. Frontend Health       — Components, 3D, a11y, design system
7. Backend Health        — Auth, validation, rate limiting, security
8. Content Completeness  — Games, age bands, educational quality
```

### Severity Scale

```
CRITICAL  — App broken or security hole       → Must fix immediately
HIGH      — Significant bug or gap             → Fix this session
MEDIUM    — Convention or quality issue         → Fix when convenient
LOW       — Minor improvement                  → Optional
INFO      — Observation or idea                → No action needed
```

### Files the Agent Creates/Modifies

```
AGENT-REPORT.md     — Generated after each sweep (overwritten, git preserves history)
PROGRESS.md         — Updated with evaluation results
CLAUDE.md           — Never modified by the agent (read-only reference)
Source files         — Modified only after admin approval
```
