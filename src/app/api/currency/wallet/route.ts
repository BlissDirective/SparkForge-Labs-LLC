// GET /api/currency/wallet — Fetch child's gem wallet
import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiSuccess, apiError, requireAuth, verifyChildOwnership } from '@/lib/api-helpers';
import { z } from 'zod';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const childId = req.nextUrl.searchParams.get('childId');
  if (!childId) return apiError('childId is required', 400);

  // Validate UUID format
  const uuidSchema = z.string().uuid();
  if (!uuidSchema.safeParse(childId).success) {
    return apiError('Invalid childId format', 400);
  }

  if (!(await verifyChildOwnership(auth.user.id, childId))) {
    return apiError('Child not found', 404);
  }

  const supabase = await createServerSupabase();

  // Get or create wallet
  const { data: wallet } = await supabase
    .from('currency_wallets')
    .select('*')
    .eq('child_id', childId)
    .single();

  if (!wallet) {
    // Auto-create wallet with starter gems
    const { data: newWallet, error } = await supabase
      .from('currency_wallets')
      .insert({ child_id: childId, gems: 50, gems_earned_lifetime: 50 })
      .select()
      .single();

    if (error) {
      return apiError('Failed to create wallet', 500);
    }

    // Record starter transaction
    await supabase.from('currency_transactions').insert({
      child_id: childId,
      type: 'admin_grant',
      amount: 50,
      balance_after: 50,
      description: 'Welcome bonus! Start spending!',
    });

    return apiSuccess({ wallet: newWallet });
  }

  return apiSuccess({ wallet });
}
