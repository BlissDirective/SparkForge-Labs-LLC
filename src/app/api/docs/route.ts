// GET /api/docs           — OpenAPI 3.1 JSON spec
// GET /api/docs?ui=1      — Swagger UI (CDN-embed)
// API-ENH OpenAPI 3.1 (Ultra) — Phase 5 task #9
//
// Serves the auto-generated OpenAPI spec + an embedded Swagger UI.
// No auth required on the spec itself (it's declarative metadata).
// In production, consider gating behind an admin check if schema
// disclosure becomes a competitive concern.
import { NextRequest, NextResponse } from 'next/server';

// Force dynamic — the OpenAPI spec generator uses reflection that
// Next's static page-data collection pass cannot safely evaluate.
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Import at request time so Next's build-time metadata walker never
  // executes the zod-to-openapi registry.
  const { generateOpenApiSpec } = await import('@/lib/api/openapi');
  const url = req.nextUrl;
  const wantsUi = url.searchParams.get('ui') === '1';

  if (wantsUi) {
    // The CDN script tags below are intentionally blocked by the nonce-based
    // CSP in production (script-src has no jsdelivr allowance). The UI is
    // only useful in dev/preview where CSP is relaxed ('unsafe-eval' is
    // present) and can be reached via ?ui=1. For production API clients, use
    // the JSON spec directly at /api/docs.
    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>SparkForge API — Swagger UI</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
  <style>body{margin:0}</style>
</head>
<body>
  <div id="swagger"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.addEventListener('load', function () {
      window.SwaggerUIBundle({
        url: '/api/docs',
        dom_id: '#swagger',
        deepLinking: true,
        persistAuthorization: true,
      });
    });
  </script>
</body>
</html>`;
    return new NextResponse(html, {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }

  const spec = generateOpenApiSpec();
  return NextResponse.json(spec, {
    status: 200,
    headers: {
      // The spec is deterministic per deploy — cache aggressively.
      'cache-control': 'public, max-age=60, s-maxage=600',
    },
  });
}
