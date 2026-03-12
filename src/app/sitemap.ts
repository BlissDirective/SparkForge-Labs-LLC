// ════════════════════════════════════════════════════
// SITEMAP — Dynamic XML sitemap for SEO
// Uses /labs/ routes per SparkForge terminology
// ════════════════════════════════════════════════════

import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://sparkforge.app';

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/arcade`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  // Generate Lab pages (/labs/1 through /labs/10)
  const labPages: MetadataRoute.Sitemap = Array.from(
    { length: 10 },
    (_, i) => ({
      url: `${baseUrl}/labs/${i + 1}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })
  );

  return [...staticPages, ...labPages];
}
