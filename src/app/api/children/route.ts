// GET /api/children — List parent's children
// POST /api/children — Create a child profile
//
// AUTH-MED-002 (B): POST enforces COPPA consent via `requireAuthWithConsent`.
// GET remains on `requireAuth` so the dashboard can still render (showing
// zero children) while the consent prompt is displayed.
import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { CreateChildSchema } from '@/lib/validations';
import {
  apiSuccess,
  apiError,
  parseBody,
  requireAuth,
  requireAuthWithConsent,
} from '@/lib/api-helpers';
import { canCreateChild } from '@/lib/tier-config';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const supabase = await createServerSupabase();
  // v3 Gap 3: Hide soft-archived children from the parent's active
  // view. Archived rows stay in the DB (preserving XP, badges, progress)
  // but are invisible to listing and tier-limit checks.
  const { data: children, error } = await supabase
    .from('children')
    .select('*')
    .eq('parent_id', auth.user.id)
    .is('deactivated_at', null)
    .order('created_at', { ascending: true });

  if (error) return apiError('Failed to fetch children', 500);

  return apiSuccess(children || []);
}

export async function POST(req: NextRequest) {
  // AUTH-MED-002 (B): must have COPPA consent to create child profiles.
  const auth = await requireAuthWithConsent(req);
  if (!auth.success) return auth.response;

  const parsed = await parseBody(req, CreateChildSchema);
  if (!parsed.success) return parsed.response;

  const supabase = await createServerSupabase();

  // v3 Gap 3: Only count active (non-archived) children against the tier limit
  const { count } = await supabase
    .from('children')
    .select('id', { count: 'exact', head: true })
    .eq('parent_id', auth.user.id)
    .is('deactivated_at', null);

  if (!canCreateChild(auth.user.tier, count || 0)) {
    return apiError(
      "You've reached your plan's child profile limit. Upgrade to add more!",
      403, 'TIER_LIMIT'
    );
  }

  const { data: child, error } = await supabase
    .from('children')
    .insert({
      parent_id: auth.user.id,
      display_name: parsed.data.displayName,
      age: parsed.data.age || 10,
      age_band: parsed.data.ageBand,
      avatar_config: parsed.data.avatarConfig || {},
    })
    .select()
    .single();

  if (error) return apiError('Failed to create child profile', 500);

  return apiSuccess(child, 201);
}
