// ════════════════════════════════════════════════════════════════
// versioning — API-ENH OpenAPI 3.1 (Ultra)
// Phase 5 task #9 · /api/v1 /api/v2 + deprecation warnings
// ════════════════════════════════════════════════════════════════
// Thin middleware helper for versioned routes. Each route declares
// its current version + minimum supported version; the helper:
//   - Reads the `api-version` header or falls back to the URL prefix
//   - Sets Sunset + Deprecation response headers when an older version
//     is requested.
//   - Annotates the response with the `x-sparkforge-api-version` header.
//
// Routes adopt versioning opt-in — current routes continue to live at
// /api/* (= v1 by convention) until their handlers migrate to
// /api/v2/* with the same Zod schemas registered in openapi.ts.
// ════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';

export type ApiVersion = 'v1' | 'v2';

export const CURRENT_API_VERSION: ApiVersion = 'v1';
export const LATEST_API_VERSION: ApiVersion = 'v1';
export const DEPRECATED_VERSIONS: Record<ApiVersion, { sunset: string; replacement: ApiVersion } | null> = {
  v1: null, // v1 is current — not deprecated until v2 lands
  v2: null,
};

/**
 * Resolve the requested API version from the URL or header.
 *
 * Order:
 *   1. URL prefix  `/api/vN/...`
 *   2. Header      `x-api-version: vN`
 *   3. Default     CURRENT_API_VERSION
 */
export function resolveApiVersion(req: NextRequest): ApiVersion {
  const url = req.nextUrl.pathname;
  const match = url.match(/^\/api\/(v[12])\//);
  if (match) return match[1] as ApiVersion;
  const header = req.headers.get('x-api-version');
  if (header === 'v1' || header === 'v2') return header;
  return CURRENT_API_VERSION;
}

/** Append deprecation + sunset + api-version headers to a response. */
export function annotateApiResponse(
  response: NextResponse,
  version: ApiVersion,
): NextResponse {
  response.headers.set('x-sparkforge-api-version', version);
  response.headers.set('x-sparkforge-latest-version', LATEST_API_VERSION);
  const deprecation = DEPRECATED_VERSIONS[version];
  if (deprecation) {
    response.headers.set('deprecation', 'true');
    response.headers.set('sunset', deprecation.sunset);
    response.headers.set(
      'link',
      `</api/${deprecation.replacement}>; rel="successor-version"`,
    );
  }
  return response;
}

/**
 * Convenience wrapper for route handlers — annotate *any* NextResponse
 * before returning it.
 *
 *   export async function GET(req: NextRequest) {
 *     const version = resolveApiVersion(req);
 *     const res = apiSuccess({ ... });
 *     return annotateApiResponse(res, version);
 *   }
 */
