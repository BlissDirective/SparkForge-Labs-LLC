// ════════════════════════════════════════════════════
// CRON — Season activation/deactivation
// Runs daily. Sets seasons.is_active based on whether CURRENT_DATE
// falls within each season's [starts_on, ends_on] window.
// ════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { apiSuccess, apiError, sanitizeErrorMessage } from '@/lib/api-helpers';
import { verifyCronBearer } from '@/lib/cron-auth';
import { createAdminClient } from '@/lib/supabase/server';
import { getActiveSeason } from '@/lib/seasons/SeasonEngine';

export async function GET(req: NextRequest) {
  const denied = verifyCronBearer(req, { routeName: 'seasons' });
  if (denied) return denied;

  const supabase = createAdminClient();

  try {
    const { data: rows } = await supabase.from('seasons').select('key, starts_on, ends_on, is_active');
    const today = new Date().toISOString().split('T')[0];

    let activated = 0;
    let deactivated = 0;

    for (const s of rows ?? []) {
      const shouldBeActive = today >= s.starts_on && today <= s.ends_on;
      if (shouldBeActive === s.is_active) continue;
      await supabase
        .from('seasons')
        .update({ is_active: shouldBeActive, updated_at: new Date().toISOString() })
        .eq('key', s.key);
      if (shouldBeActive) activated++;
      else deactivated++;
    }

    return apiSuccess({
      activeSeason: getActiveSeason()?.key ?? null,
      activated,
      deactivated,
      checked: (rows ?? []).length,
    });
  } catch (err) {
    return apiError(sanitizeErrorMessage(err, 'Season cron failed'), 500);
  }
}
