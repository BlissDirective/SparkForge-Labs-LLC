// ════════════════════════════════════════════════════
// ROBOTS.TXT — Search engine crawling rules
// ════════════════════════════════════════════════════

import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://sparkforge.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/parent/', '/admin/', '/onboarding/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
