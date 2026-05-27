// POST /api/currency/spend — Spend gems from wallet
import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiSuccess, apiError, parseBody, requireAuth, verifyChildOwnership } from '@/lib/api-helpers';
import { z } from 'zod';

const SpendSchema = z.object({
  childId: z.string().uuid(),
  amount: z.number().int().positive().max(1000),
  reason: z.string().min(1).max(100),
  type: z.enum([
    'purchase_freeze', 'spent_cosmetic', 'wager_entry',
  ]).default('spent_cosmetic'),
});

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const parsed = await parseBody(req, SpendSchema);
  if (!parsed.success) return parsed.response;

  const { childId, amount, reason, type } = parsed.data;

  if (!(await verifyChildOwnership(auth.user.id, childId))) {
    return apiError('Child not found', 404);
  }

  const supabase = await createServerSupabase();

  // Get wallet with lock
  const { data: wallet } = await supabase
    .from('currency_wallets')
    .select('*')
    .eq('child_id', childId)
    .single();

  if (!wallet) {
    return apiError('Wallet not found', 404);
  }

  if (wallet.gems < amount) {
    return apiError(`Not enough gems! You have ${wallet.gems} but need ${amount}.`, 400);
  }

  const newGems = wallet.gems - amount;

  // Update wallet
  const { error: walletError } = await supabase
    .from('currency_wallets')
    .update({
      gems: newGems,
      gems_spent_lifetime: wallet.gems_spent_lifetime + amount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', wallet.id);

  if (walletError) {
    return apiError('Failed to spend gems', 500);
  }

  // Record transaction
  await supabase.from('currency_transactions').insert({
    child_id: childId,
    type,
    amount: -amount,
    balance_after: newGems,
    description: reason,
  });

  return apiSuccess({
    gemsSpent: amount,
    newBalance: newGems,
    message: `-${amount} gems spent on ${reason}`,
  });
}
