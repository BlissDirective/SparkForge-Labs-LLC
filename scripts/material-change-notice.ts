#!/usr/bin/env node
/* eslint-disable no-console */
// ════════════════════════════════════════════════════
// CLI — Material Change Notification Sender
// R3 / AUDIT 2 — Implements the one-shot sender used by the
// MATERIAL_CHANGE_RUNBOOK procedure.
//
// Sends a pre-composed HTML email to every SparkForge parent
// account matching the chosen audience and writes an audit row
// to subscription_events.
//
// Usage:
//   npx tsx scripts/material-change-notice.ts \
//     --subject "Upcoming change to your SparkForge subscription" \
//     --html-file ./notices/2026-05-01.html \
//     --effective-date 2026-05-01 \
//     --audience paid \
//     --dry-run
//
// Flags:
//   --subject <text>            Email subject (required)
//   --html-file <path>          Path to the HTML body (required)
//   --text-file <path>          Plain-text fallback (optional; auto-
//                               derived from HTML if omitted)
//   --effective-date YYYY-MM-DD When the change takes effect (required;
//                               must be >= 7 days in the future)
//   --audience all|active|paid  Recipient filter (default: active)
//   --dry-run                   Render + log without sending
//
// Env required:
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   RESEND_API_KEY
//   NEXT_PUBLIC_APP_URL
// ════════════════════════════════════════════════════
import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

// Send via Resend REST API directly (mirrors src/lib/email.ts approach —
// no additional npm dependency required).
const RESEND_URL = 'https://api.resend.com/emails';

async function sendViaResend(apiKey: string, payload: {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  tags?: { name: string; value: string }[];
}): Promise<{ id?: string }> {
  const res = await fetch(RESEND_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend ${res.status}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as { id?: string };
}

type Audience = 'all' | 'active' | 'paid';

function parseArgs(): {
  subject: string;
  htmlFile: string;
  textFile?: string;
  effectiveDate: string;
  audience: Audience;
  dryRun: boolean;
} {
  const argv = process.argv.slice(2);
  const get = (flag: string): string | undefined => {
    const idx = argv.indexOf(flag);
    return idx >= 0 ? argv[idx + 1] : undefined;
  };
  const subject = get('--subject');
  const htmlFile = get('--html-file');
  const textFile = get('--text-file');
  const effectiveDate = get('--effective-date');
  const audienceRaw = (get('--audience') ?? 'active') as Audience;
  const dryRun = argv.includes('--dry-run');

  if (!subject || !htmlFile || !effectiveDate) {
    console.error('Missing required flag. See script header for usage.');
    process.exit(2);
  }
  if (!['all', 'active', 'paid'].includes(audienceRaw)) {
    console.error('--audience must be one of: all, active, paid');
    process.exit(2);
  }

  const effectiveAt = new Date(`${effectiveDate}T00:00:00Z`);
  const earliestAllowed = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  if (Number.isNaN(effectiveAt.getTime())) {
    console.error('--effective-date must be a valid YYYY-MM-DD');
    process.exit(2);
  }
  if (effectiveAt < earliestAllowed) {
    console.error(
      `--effective-date must be at least 7 days in the future (got ${effectiveDate}). CA ARL minimum.`
    );
    process.exit(2);
  }

  return { subject, htmlFile, textFile, effectiveDate, audience: audienceRaw, dryRun };
}

function stripHtml(html: string): string {
  return html.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

async function main() {
  const args = parseArgs();

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://sparkforge-labs.com';

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase env (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).');
    process.exit(1);
  }
  if (!RESEND_API_KEY && !args.dryRun) {
    console.error('Missing RESEND_API_KEY. Use --dry-run to preview without sending.');
    process.exit(1);
  }

  const html = await readFile(args.htmlFile, 'utf8');
  const text = args.textFile ? await readFile(args.textFile, 'utf8') : stripHtml(html);

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let query = supabase.from('parents').select('id, email').not('email', 'is', null);
  if (args.audience === 'active') query = query.neq('subscription_status', 'canceled');
  if (args.audience === 'paid') query = query.in('subscription_tier', ['plus', 'forge']);

  const { data: parents, error } = await query;
  if (error) {
    console.error('Failed to load parents:', error.message);
    process.exit(1);
  }

  const recipients = parents ?? [];
  console.log(
    `[material-change] audience=${args.audience} recipients=${recipients.length} effective=${args.effectiveDate} dry-run=${args.dryRun}`
  );

  if (args.dryRun) {
    console.log('Dry run — first 5 recipients:', recipients.slice(0, 5).map((p) => p.email));
    console.log(`Subject: ${args.subject}`);
    console.log(`App URL: ${APP_URL}`);
    console.log('No email sent, no audit rows written.');
    return;
  }

  let sent = 0;
  let failed = 0;

  for (const p of recipients) {
    try {
      const send = await sendViaResend(RESEND_API_KEY!, {
        from: 'SparkForge <notices@sparkforge-labs.com>',
        to: p.email,
        subject: args.subject,
        html,
        text,
        tags: [
          { name: 'kind', value: 'material_change_notice' },
          { name: 'effective_date', value: args.effectiveDate },
        ],
      });
      const resendId = send.id ?? null;

      await supabase.from('subscription_events').insert({
        parent_id: p.id,
        stripe_event_id: `material_change_${args.effectiveDate}_${p.id}`,
        event_type: 'material.change.notice.sent',
        data: {
          subject: args.subject,
          effective_date: args.effectiveDate,
          audience: args.audience,
          resend_id: resendId,
          sent_at: new Date().toISOString(),
        },
      });
      sent++;
    } catch (err) {
      failed++;
      console.error(`Send failed for ${p.email}:`, err instanceof Error ? err.message : String(err));
    }
  }

  console.log(`[material-change] done sent=${sent} failed=${failed}`);
}

main().catch((err) => {
  console.error('[material-change] fatal:', err);
  process.exit(1);
});
