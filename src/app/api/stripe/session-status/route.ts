// GET /api/stripe/session-status?session_id=cs_…
//
// PAY-HIGH-003 (B): Server-side verification of a Stripe Checkout
// Session's true state, used by the subscription success page after
// redirect. Replaces the previous `?success=true` query flag, which
// could be forged by anyone typing the URL manually.
//
// Returns:
//   - session.payment_status ('paid' | 'unpaid' | 'no_payment_required')
//   - session.status ('open' | 'complete' | 'expired')
//   - parent.subscription_status / subscription_tier (webhook-owned)
//   - active: boolean (tier active OR trialing)
//
// Ownership check: the authenticated user must either own the
// parents.stripe_customer_id matching this session, OR the session's
// metadata.supabase_id must equal their id. The second branch covers
// the first-ever checkout where the webhook hasn't yet written
// stripe_customer_id onto the parents row.

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiSuccess, apiError, requireAuth } from '@/lib/api-helpers';
import { getStripe, getCustomerId } from '@/lib/stripe';

export const runtime = 'nodejs';

const SessionIdSchema = z.string().regex(/^cs_[A-Za-z0-9_]+$/, 'invalid_session_id');

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const sessionIdRaw = new URL(req.url).searchParams.get('session_id');
  const parsed = SessionIdSchema.safeParse(sessionIdRaw);
  if (!parsed.success) {
    return apiError('Invalid session_id', 400, 'INVALID_SESSION_ID');
  }
  const sessionId = parsed.data;

  const stripe = getStripe();
  if (!stripe) {
    return apiError('Stripe is not configured.', 503, 'STRIPE_NOT_CONFIGURED');
  }

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (err) {
    console.warn('[session-status] Stripe retrieve failed:', err);
    return apiError('Session not found', 404, 'SESSION_NOT_FOUND');
  }

  const supabase = await createServerSupabase();
  const { data: parent } = await supabase
    .from('parents')
    .select('stripe_customer_id, subscription_status, subscription_tier')
    .eq('id', auth.user.id)
    .single();

  // Ownership — session belongs to this parent?
  const sessionCustomerId = getCustomerId(session.customer);
  const metadataSupabaseId = session.metadata?.supabase_id;
  const ownsByCustomer =
    !!sessionCustomerId &&
    !!parent?.stripe_customer_id &&
    sessionCustomerId === parent.stripe_customer_id;
  const ownsByMetadata = metadataSupabaseId === auth.user.id;

  if (!ownsByCustomer && !ownsByMetadata) {
    // Don't leak existence — 404 is safer than 403 here.
    return apiError('Session not found', 404, 'SESSION_NOT_FOUND');
  }

  const subscriptionStatus = parent?.subscription_status ?? 'none';
  const active = subscriptionStatus === 'active' || subscriptionStatus === 'trialing';

  return apiSuccess({
    paymentStatus: session.payment_status,
    status: session.status,
    subscriptionStatus,
    subscriptionTier: parent?.subscription_tier ?? 'free',
    active,
  });
}
