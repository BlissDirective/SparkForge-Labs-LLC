# SparkForge UX — Color Contrast Policy

> UX-HIGH-005 (Option C). Governs text opacity + color pairs to meet WCAG 2.2 §1.4.3 (AA) on the dark Frost-Prismatic theme.

---

## Rule

**Normal text (≤18 px, or ≤14 px bold) requires contrast ratio ≥ 4.5 : 1 against its background.**

On our dark `surface-deep` background (`#0A0E16`):

| Tailwind opacity | Approx contrast | Verdict |
|---|---|---|
| `text-white/10` | 1.3 : 1 | ❌ Fails AA even for large text |
| `text-white/20` | 2.1 : 1 | ❌ Fails AA |
| `text-white/30` | 3.1 : 1 | ❌ Fails AA (normal), ❌ Fails AAA (large) |
| `text-white/40` | 3.9 : 1 | ❌ Fails AA (normal) — only safe for graphic borders |
| **`text-white/50`** | **4.8 : 1** | **✓ AA normal** |
| `text-white/60` | 5.9 : 1 | ✓ AA normal |
| `text-white/70` | 7.1 : 1 | ✓ AA normal, AAA large |
| `text-white/80` | 8.3 : 1 | ✓ AAA normal |

## Enforcement

The ESLint rule `no-restricted-syntax` in `eslint.config.mjs` flags any JSX `className` literal containing `text-white/10|20|30|40` with a **warning**. CI treats warnings as non-blocking during the rollout — this gives us a regression floor without failing the existing 600+ legacy offenders.

```
warning  Low-contrast text (UX-HIGH-005): text-white/10-40 fails WCAG AA on
dark backgrounds. Use text-white/50 or higher, or add an aria-label /
eslint-disable comment for intentionally decorative cases.
```

## Escape hatch

Some surfaces are intentionally de-emphasized (copyright watermarks, tooltip chrome, strikethrough-on-completed items). For those, opt out per-line with a short justification:

```tsx
{/* eslint-disable-next-line no-restricted-syntax -- decorative watermark */}
<p className="text-white/30">© 2026 BlissDirective</p>
```

## Migration plan

1. **Today (this PR):** Rule added at `warn` severity. Highest-visibility cases (toast dismiss, demo/email banner dismiss X, "remaining" label) migrated to `/50+`.
2. **Phase 3 (medium):** Backfill remaining ~600 offenders in 50-item batches organized by component. Each batch: run eslint, grep offenders, raise opacity or add eslint-disable with justification, visual spot-check.
3. **Phase 4 (enhancement):** Flip severity from `warn` to `error`. Requires the Phase 3 backfill to complete.

## Color pairs that fail AA (known)

| Pair | Used in | Fix |
|---|---|---|
| `text-spark-purple` on `surface-deep` | subscription tier badge | Pair with a dark chip bg (`bg-spark-purple/10`) OR use `text-spark-purple/90` |
| Amber text on amber chip (`text-amber-100` on `bg-amber-500/20`) | verify banner | Swap to `text-amber-50` |
| Gray placeholder text in inputs | form fields | `placeholder:text-white/40` → `placeholder:text-white/55` |

## Tooling

- Chrome DevTools → Inspect → Accessibility → Contrast ratio (per-element)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) for design-time decisions
- `npx eslint src/` — locally surfaces the rule warnings on touched files
