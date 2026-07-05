// ════════════════════════════════════════════════════
// EMAIL TEMPLATE — Parent Weekly Digest
// R7b — extracted from the weekly-digest cron route so the
// digest email shares the same presentation conventions as the
// other transactional templates (annual-reminder, dunning,
// post-purchase, trial-reminder): <!doctype> + table layout,
// inline styles, AA-legible body text.
//
// Presentation only — subject line, data, and copy are unchanged
// from the original inline renderer. Rendered from
// src/app/api/cron/weekly-digest/route.ts.
// ════════════════════════════════════════════════════

export interface ChildDigest {
  displayName: string;
  gamesPlayed: number;
  minutes: number;
  xp: number;
  topLab: string | null;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

const BRAND_COLOR = '#00BBFF';
const BG_DARK = '#0A0E16';

/** Minimal HTML escaping for user-supplied strings (child display names). */
function escapeHtml(input: string): string {
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderWeeklyDigest(
  parentName: string | null,
  digests: ChildDigest[],
  starter: string,
): RenderedEmail {
  const greeting = parentName ? `Hi ${escapeHtml(parentName.split(' ')[0])}` : 'Hi there';
  const subject = 'Your SparkForge weekly recap';

  const childBlocks = digests
    .map((d) => {
      const name = escapeHtml(d.displayName);
      const stats =
        d.gamesPlayed > 0
          ? `<li style="margin:0 0 4px;">Games played: <strong style="color:#ffffff;">${d.gamesPlayed}</strong></li>
             <li style="margin:0 0 4px;">Time learning: <strong style="color:#ffffff;">${d.minutes} min</strong></li>
             <li style="margin:0 0 4px;">XP earned: <strong style="color:#ffffff;">${d.xp}</strong></li>` +
            (d.topLab
              ? `<li style="margin:0;">Top lab: <strong style="color:#ffffff;">${escapeHtml(d.topLab)}</strong></li>`
              : '')
          : `<li style="margin:0;">No games completed this week — a great excuse to explore a new lab together!</li>`;
      return `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;">
          <tr><td style="padding:16px 20px;">
            <h3 style="margin:0 0 8px;color:#ffffff;font-size:16px;">${name}</h3>
            <ul style="margin:0;padding-left:18px;color:rgba(255,255,255,0.75);font-size:14px;line-height:1.7;">
              ${stats}
            </ul>
          </td></tr>
        </table>`;
    })
    .join('');

  const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"/><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:${BG_DARK};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:rgba(255,255,255,0.85);">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG_DARK};">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#0f1424;border:1px solid rgba(255,255,255,0.08);border-radius:14px;overflow:hidden;">
      <tr><td style="padding:28px 32px 8px 32px;border-bottom:1px solid rgba(255,255,255,0.06);">
        <p style="margin:0;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${BRAND_COLOR};">Weekly recap</p>
        <h1 style="margin:8px 0 0;font-size:22px;color:#ffffff;">SparkForge Weekly Digest</h1>
      </td></tr>
      <tr><td style="padding:24px 32px;">
        <p style="margin:0 0 20px;font-size:14px;line-height:22px;color:rgba(255,255,255,0.75);">
          ${greeting} — here's what your explorers were up to this week.
        </p>
        ${childBlocks}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 4px;background:rgba(0,187,255,0.06);border-left:3px solid ${BRAND_COLOR};border-radius:8px;">
          <tr><td style="padding:14px 18px;">
            <p style="margin:0 0 4px;color:#ffffff;font-size:14px;font-weight:700;">This week's AI conversation starter</p>
            <p style="margin:0;color:rgba(255,255,255,0.75);font-size:14px;line-height:21px;">${escapeHtml(starter)}</p>
          </td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.06);background:rgba(0,0,0,0.2);">
        <p style="margin:0;font-size:12px;line-height:18px;color:rgba(255,255,255,0.6);">
          You're receiving this because weekly digests are enabled for your SparkForge account.
        </p>
      </td></tr>
    </table>
    <div style="margin-top:16px;font-size:11px;color:rgba(255,255,255,0.55);">
      &copy; ${new Date().getFullYear()} SparkForge LLC &middot; an Illinois limited liability company
    </div>
  </td></tr>
</table>
</body>
</html>`;

  const textLines = digests.map((d) =>
    d.gamesPlayed > 0
      ? `${d.displayName}: ${d.gamesPlayed} games, ${d.minutes} min, ${d.xp} XP${d.topLab ? `, top lab: ${d.topLab}` : ''}`
      : `${d.displayName}: no games completed this week`,
  );
  const text = `${greeting} — your SparkForge weekly recap:\n\n${textLines.join('\n')}\n\nConversation starter: ${starter}\n`;

  return { subject, html, text };
}
