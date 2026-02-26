// GET/PATCH/DELETE /api/children/:childId
import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { UpdateChildSchema } from '@/lib/validations';
import { apiSuccess, apiError, parseBody, requireAuth, verifyChildOwnership } from '@/lib/api-helpers';

interface Params { params: Promise<{ childId: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const { childId } = await params;
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  if (!(await verifyChildOwnership(auth.user.id, childId))) return apiError('Child not found', 404);

  const supabase = createServerSupabase();
  const { data } = await supabase.from('children').select('*').eq('id', childId).single();
  if (!data) return apiError('Child not found', 404);

  return apiSuccess(data);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { childId } = await params;
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  if (!(await verifyChildOwnership(auth.user.id, childId))) return apiError('Child not found', 404);

  const parsed = await parseBody(req, UpdateChildSchema);
  if (!parsed.success) return parsed.response;

  const supabase = createServerSupabase();

  const updateData: Record<string, unknown> = {};
  if (parsed.data.displayName) updateData.display_name = parsed.data.displayName;
  if (parsed.data.avatarConfig) updateData.avatar_config = parsed.data.avatarConfig;
  if (parsed.data.dailyTimeLimitMinutes !== undefined) updateData.daily_time_limit_minutes = parsed.data.dailyTimeLimitMinutes;
  if (parsed.data.promptLabEnabled !== undefined) updateData.prompt_lab_enabled = parsed.data.promptLabEnabled;
  if (parsed.data.preferences) updateData.preferences = parsed.data.preferences;

  const { data, error } = await supabase
    .from('children').update(updateData).eq('id', childId).select().single();

  if (error) return apiError('Failed to update child', 500);

  return apiSuccess(data);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { childId } = await params;
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  if (!(await verifyChildOwnership(auth.user.id, childId))) return apiError('Child not found', 404);

  const supabase = createServerSupabase();
  const { error } = await supabase.from('children').delete().eq('id', childId);

  if (error) return apiError('Failed to delete child profile', 500);

  return apiSuccess({ deleted: true });
}
