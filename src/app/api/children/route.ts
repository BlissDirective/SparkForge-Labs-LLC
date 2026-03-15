// GET /api/children — List parent's children
// POST /api/children — Create a child profile
import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { CreateChildSchema } from '@/lib/validations';
import { apiSuccess, apiError, parseBody, requireAuth } from '@/lib/api-helpers';
import { canCreateChild } from '@/lib/tier-config';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const supabase = await createServerSupabase();
  const { data: children, error } = await supabase
    .from('children')
    .select('*')
    .eq('parent_id', auth.user.id)
    .order('created_at', { ascending: true });

  if (error) return apiError('Failed to fetch children', 500);

  return apiSuccess(children || []);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const parsed = await parseBody(req, CreateChildSchema);
  if (!parsed.success) return parsed.response;

  const supabase = await createServerSupabase();

  const { count } = await supabase
    .from('children')
    .select('id', { count: 'exact', head: true })
    .eq('parent_id', auth.user.id);

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
