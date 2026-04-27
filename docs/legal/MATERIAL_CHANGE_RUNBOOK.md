# Material Change Notification Runbook

> **Purpose:** Operational procedure for sending the advance notice required
> by California ARL AB 2863, ROSCA, and SparkForge Privacy §12 / ToS §4e item 6
> whenever a material change is made to subscription terms or to the treatment
> of children's personal information.

**When this applies:**
- Any price increase, new billing cadence, or change to the feature set of an
  existing paid tier.
- Any material change in privacy practices affecting children's PI — new
  third-party recipient, new collection surface, new retention period.
- Any change to the ToS or Privacy Policy that a reasonable parent would want
  to know about before it takes effect.

**When this does NOT apply:**
- Typo / grammar fixes
- Adding a sub-processor that is functionally equivalent to an existing one
  (e.g., replacing an email provider with another transactional email provider
  under equivalent DPA terms) — only if **no change in data flow**.
- Price reductions or tier-feature additions that strictly expand value.

---

## Notification Requirements

| Regulation | Advance notice | Medium |
|---|---|---|
| CA ARL AB 2863 (price / auto-renewal) | 7–30 days | Email |
| ROSCA 15 U.S.C. §8403 | "clear and conspicuous" | Email + in-app |
| COPPA 312.4(c) (child-data material change) | Before the change + new VPC | Email to every registered parent |
| Privacy §12 (our own commitment) | Reasonable advance notice; 30 days default | Email |

**Default policy:** 30-day advance email notice for every material change,
regardless of which regulation strictly applies. Simpler and above every
regulatory floor.

---

## Procedure

### 1. Freeze the change description
Write a single-page summary of the change. Include:
- What is changing
- What it affects (tiers, features, prices, data practices)
- Effective date
- What the parent can do (cancel, review, contact us)

### 2. Update legal docs **on the feature branch** before sending the notice
Edit `src/app/(marketing)/terms/page.tsx` and/or
`src/app/(marketing)/privacy/page.tsx`. Bump the "Last Updated" date.
Review on Vercel preview.

### 3. Prepare the notice email content
Draft the HTML + plain-text message. Keep one CTA: link to
`/parent/subscription` or `/settings/legal`. Include:
- Subject: `Upcoming change to your SparkForge [subscription|privacy] — [date]`
- Summary of the change
- Effective date
- "You may cancel before the change takes effect" language
- Link to the updated docs
- Legal-footer block (same as trial-reminder + dunning templates)

### 4. Send via the CLI script
```bash
# Requires: RESEND_API_KEY, STRIPE_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY,
#           NEXT_PUBLIC_APP_URL in env.
npx tsx scripts/material-change-notice.ts \
  --subject "Upcoming change to your SparkForge subscription" \
  --html-file ./change-2026-05-01.html \
  --effective-date "2026-05-01" \
  --dry-run
# Review the dry-run output, then re-run without --dry-run.
```

### 5. Audit log
The CLI script writes a `material.change.notice.sent` row to
`subscription_events` for each recipient. Verify the row count matches
the expected recipient count.

### 6. Post-effective-date check
- Confirm the ToS / Privacy docs are live with the new "Last Updated" date.
- Confirm at least one recipient has opened the email (Resend dashboard).
- If the change affects children's PI, record that new VPC was sought (a
  new affirmative re-consent checkbox at login, Privacy §12 requires this
  for material child-data changes).

---

## CLI script reference

See `scripts/material-change-notice.ts`. Supported flags:

| Flag | Required | Description |
|---|---|---|
| `--subject "text"` | yes | Email subject line |
| `--html-file path` | yes | Path to the HTML body (full document) |
| `--text-file path` | no | Path to plain-text fallback (auto-stripped from HTML if absent) |
| `--effective-date YYYY-MM-DD` | yes | Used in the audit log and for dedup |
| `--audience [active\|paid\|all]` | default `active` | Recipient filter |
| `--dry-run` | no | Renders and logs recipients without sending |

The script refuses to run if `--effective-date` is less than 7 days in the
future (CA ARL minimum advance notice).

---

## Records retention

Each material-change batch writes an audit row with:
- `event_type = 'material.change.notice.sent'`
- `stripe_event_id = material_change_<effective_date>_<parent_id>`
- `data = { effective_date, subject, audience, resend_id }`

These rows are retained for the life of the account per Privacy §7 and are
available for regulator review.
