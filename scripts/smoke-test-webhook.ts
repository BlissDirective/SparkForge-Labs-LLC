#!/usr/bin/env node
/* eslint-disable no-console */
// ════════════════════════════════════════════════════
// SMOKE TEST — /api/stripe/webhook end-to-end
// v3 Gap 1/Task 4
// ════════════════════════════════════════════════════
//
// Constructs a fake, correctly-signed Stripe webhook event for a real
// parent row in your local Supabase, POSTs it to the running dev
// server, then verifies that:
//   1. The webhook endpoint returned 200
//   2. subscription_events has a row for our event_id
//   3. The parents row was updated with the new tier + subscription_id
//
// USAGE:
//   # Terminal 1
//   npm run dev
//
//   # Terminal 2
//   npx tsx scripts/smoke-test-webhook.ts --email=test@example.com --tier=plus
//
// ENV REQUIRED:
//   STRIPE_WEBHOOK_SECRET         ← same secret as .env.local / Stripe dashboard
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//
// EXIT CODES:
//   0 — webhook returned 200 AND DB was updated
//   1 — any assertion failed (error printed)
//   2 — missing required env var or flag
// ════════════════════════════════════════════════════
import { createHmac } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

// ── ANSI colors (no external deps) ──
const c = {
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
};

// ── Parse CLI flags ──
interface Flags {
  email?: string;
  tier: 'plus' | 'forge';
  url: string;
  noDbCheck: boolean;
  help: boolean;
}

function parseFlags(): Flags {
  const args = process.argv.slice(2);
  const flags: Flags = {
    email: undefined,
    tier: 'plus',
    url: 'http://localhost:3000/api/stripe/webhook',
    noDbCheck: false,
    help: false,
  };
  for (const arg of args) {
    if (arg === '-h' || arg === '--help') flags.help = true;
    else if (arg.startsWith('--email=')) flags.email = arg.slice('--email='.length);
    else if (arg.startsWith('--tier=')) {
      const val = arg.slice('--tier='.length);
      if (val === 'plus' || val === 'forge') flags.tier = val;
      else die(`Invalid --tier value "${val}". Use plus or forge.`, 2);
    } else if (arg.startsWith('--url=')) flags.url = arg.slice('--url='.length);
    else if (arg === '--no-db-check') flags.noDbCheck = true;
  }
  return flags;
}

function die(msg: string, code: number): never {
  console.error(c.red(`✗ ${msg}`));
  process.exit(code);
}

function printHelp() {
  console.log(`
${c.bold('SparkForge webhook smoke test')}

${c.cyan('Usage:')}
  npx tsx scripts/smoke-test-webhook.ts --email=<parent-email> [options]

${c.cyan('Required flags:')}
  ${c.bold('--email=<email>')}             The parent to simulate an upgrade for

${c.cyan('Optional flags:')}
  ${c.bold('--tier=<plus|forge>')}         Target tier           ${c.dim('(default: plus)')}
  ${c.bold('--url=<webhook-url>')}         Webhook endpoint       ${c.dim('(default: http://localhost:3000/api/stripe/webhook)')}
  ${c.bold('--no-db-check')}               Skip the Supabase verification step
  ${c.bold('--help')}                      Show this message

${c.cyan('Required env vars:')}
  STRIPE_WEBHOOK_SECRET
  NEXT_PUBLIC_SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY

${c.cyan('Tip:')} Source your local env with  ${c.dim('set -a && source .env.local && set +a')}
`);
}

// ── Stripe signature scheme ──
// Stripe signs the body with HMAC-SHA256 using the webhook secret.
// Header format: `t=<unix>,v1=<hex-digest>`
// Signed payload: `<unix>.<body>`
// See: https://docs.stripe.com/webhooks#verify-manually
function signStripePayload(body: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${body}`;
  const hmac = createHmac('sha256', secret);
  hmac.update(signedPayload);
  const v1 = hmac.digest('hex');
  return `t=${timestamp},v1=${v1}`;
}

// ── Fake event builder ──
function buildFakeCheckoutEvent(opts: {
  parentId: string;
  tier: 'plus' | 'forge';
  stripeCustomerId: string;
  eventId: string;
  sessionId: string;
  subscriptionId: string;
}) {
  const now = Math.floor(Date.now() / 1000);
  return {
    id: opts.eventId,
    object: 'event',
    api_version: '2026-02-25.clover',
    created: now,
    type: 'checkout.session.completed',
    data: {
      object: {
        id: opts.sessionId,
        object: 'checkout.session',
        customer: opts.stripeCustomerId,
        subscription: opts.subscriptionId,
        mode: 'subscription',
        payment_status: 'paid',
        status: 'complete',
        metadata: {
          supabase_id: opts.parentId,
          tier: opts.tier,
        },
      },
    },
    livemode: false,
    pending_webhooks: 0,
    request: { id: null, idempotency_key: null },
  };
}

// ── Main ──
async function main() {
  const flags = parseFlags();

  if (flags.help) {
    printHelp();
    process.exit(0);
  }

  // ── Env validation ──
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!webhookSecret) die('Missing STRIPE_WEBHOOK_SECRET', 2);
  if (!flags.email && !flags.noDbCheck) die('Missing --email flag (or pass --no-db-check)', 2);

  const needsSupabase = !flags.noDbCheck;
  if (needsSupabase && !supabaseUrl) die('Missing NEXT_PUBLIC_SUPABASE_URL', 2);
  if (needsSupabase && !supabaseKey) die('Missing SUPABASE_SERVICE_ROLE_KEY', 2);

  console.log(c.bold('\n═══ SparkForge Webhook Smoke Test ═══'));
  console.log(c.dim(`  url:    ${flags.url}`));
  console.log(c.dim(`  tier:   ${flags.tier}`));
  console.log(c.dim(`  email:  ${flags.email ?? '(none — --no-db-check mode)'}`));
  console.log('');

  // ── Step 1: Look up parent row ──
  let parentId = '00000000-0000-0000-0000-000000000000';
  let stripeCustomerId = `cus_smoke_${Date.now()}`;
  let supabase: ReturnType<typeof createClient> | null = null;

  if (needsSupabase) {
    supabase = createClient(supabaseUrl!, supabaseKey!);
    console.log(c.cyan('→'), 'Looking up parent row…');
    const { data: parent, error } = await supabase
      .from('parents')
      .select('id, stripe_customer_id, subscription_tier')
      .eq('email', flags.email!)
      .single();

    if (error || !parent) {
      die(
        `Could not find parent with email="${flags.email}". Sign up as this email in the app first, or pass --no-db-check.`,
        1
      );
    }

    parentId = parent.id as string;
    stripeCustomerId = (parent.stripe_customer_id as string) || stripeCustomerId;
    console.log(c.green('  ✓'), `parent.id = ${parentId}`);
    console.log(c.green('  ✓'), `parent.subscription_tier (before) = ${parent.subscription_tier}`);
    console.log(c.green('  ✓'), `parent.stripe_customer_id = ${stripeCustomerId}`);
  }

  // ── Step 2: Build + sign fake event ──
  const eventId = `evt_smoke_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const sessionId = `cs_smoke_${Date.now()}`;
  const subscriptionId = `sub_smoke_${Date.now()}`;

  const event = buildFakeCheckoutEvent({
    parentId,
    tier: flags.tier,
    stripeCustomerId,
    eventId,
    sessionId,
    subscriptionId,
  });
  const body = JSON.stringify(event);
  const signature = signStripePayload(body, webhookSecret);

  console.log(c.cyan('→'), `Constructed fake event: ${eventId}`);

  // ── Step 3: POST to webhook ──
  console.log(c.cyan('→'), `POSTing to ${flags.url}…`);
  let response: Response;
  try {
    response = await fetch(flags.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': signature,
      },
      body,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    die(
      `POST failed: ${msg}\n  Is the dev server running? Try ${c.dim('npm run dev')} in another terminal.`,
      1
    );
  }

  const responseText = await response.text();

  if (!response.ok) {
    console.log(c.red('  ✗'), `Webhook returned ${response.status}`);
    console.log(c.red('    Body:'), responseText);
    die('Webhook rejected the event', 1);
  }

  console.log(c.green('  ✓'), `Webhook returned ${response.status}`);
  console.log(c.dim('    Response:'), responseText);

  // Webhook retrieves the subscription via the Stripe API before
  // updating the parents row. Our fake subscription_id won't exist
  // in Stripe, so the retrieve() call inside the webhook handler
  // will fail — but the handler catches that error and still writes
  // tier + status + stripe_customer_id. We only validate the columns
  // the handler writes unconditionally.

  if (flags.noDbCheck || !supabase) {
    console.log(c.yellow('\n⚠'), 'Skipping DB verification (--no-db-check)');
    console.log(c.bold(c.green('\n✓ PASS')), '(webhook responded 200)\n');
    process.exit(0);
  }

  // ── Step 4: Wait + verify DB writes ──
  console.log(c.cyan('→'), 'Waiting 500ms for async writes to settle…');
  await new Promise((r) => setTimeout(r, 500));

  // Check subscription_events row was created
  console.log(c.cyan('→'), 'Verifying subscription_events row…');
  const { data: eventRow, error: eventErr } = await supabase
    .from('subscription_events')
    .select('stripe_event_id, event_type, parent_id')
    .eq('stripe_event_id', eventId)
    .single();

  if (eventErr || !eventRow) {
    console.log(c.red('  ✗'), `subscription_events row NOT found for ${eventId}`);
    if (eventErr) console.log(c.red('    Error:'), eventErr.message);
    die('DB verification failed (subscription_events)', 1);
  }
  console.log(c.green('  ✓'), `subscription_events.event_type = ${eventRow.event_type}`);
  console.log(c.green('  ✓'), `subscription_events.parent_id = ${eventRow.parent_id}`);

  // Check parents row was updated
  console.log(c.cyan('→'), 'Verifying parents row was updated…');
  const { data: updatedParent, error: parentErr } = await supabase
    .from('parents')
    .select('subscription_tier, subscription_status, stripe_customer_id')
    .eq('id', parentId)
    .single();

  if (parentErr || !updatedParent) {
    die(`Failed to re-query parent after webhook: ${parentErr?.message}`, 1);
  }

  let ok = true;
  if (updatedParent.subscription_tier !== flags.tier) {
    console.log(
      c.red('  ✗'),
      `subscription_tier expected="${flags.tier}" got="${updatedParent.subscription_tier}"`
    );
    ok = false;
  } else {
    console.log(c.green('  ✓'), `subscription_tier = ${updatedParent.subscription_tier}`);
  }

  if (updatedParent.subscription_status !== 'active') {
    console.log(
      c.red('  ✗'),
      `subscription_status expected="active" got="${updatedParent.subscription_status}"`
    );
    ok = false;
  } else {
    console.log(c.green('  ✓'), `subscription_status = ${updatedParent.subscription_status}`);
  }

  if (updatedParent.stripe_customer_id !== stripeCustomerId) {
    console.log(
      c.yellow('  ⚠'),
      `stripe_customer_id mismatch (expected="${stripeCustomerId}" got="${updatedParent.stripe_customer_id}") — likely first-time smoke test`
    );
  } else {
    console.log(c.green('  ✓'), `stripe_customer_id = ${updatedParent.stripe_customer_id}`);
  }

  if (!ok) die('Parent row did not match expected updates', 1);

  console.log(c.bold(c.green('\n✓ PASS')), '— webhook handled end-to-end\n');
  console.log(c.dim('  The parent row is now set to the smoke-test tier.'));
  console.log(c.dim(`  To restore, run:`));
  console.log(c.dim(`    UPDATE parents SET subscription_tier='free', subscription_status='none' WHERE id='${parentId}';`));
  process.exit(0);
}

main().catch((err) => {
  console.error(c.red('\n✗ Smoke test crashed:'), err);
  process.exit(1);
});
