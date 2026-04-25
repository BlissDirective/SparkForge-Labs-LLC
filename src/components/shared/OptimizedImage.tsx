// ════════════════════════════════════════════════════════════════
// OptimizedImage — T13 PERF-MED-002 (Opt A)
// ════════════════════════════════════════════════════════════════
// Thin wrapper around `next/image` that locks in our defaults so
// future image usage is correct by construction:
//   - Non-priority by default (lazy-load everything that isn't LCP)
//   - `sizes` defaults to a mobile-first responsive formula that
//     Next.js can match to its srcset output
//   - Default `quality={80}` (Lighthouse-recommended)
//
// Use this instead of a raw HTML image element. The ESLint rule
// `@next/next/no-img-element` is errored app-wide (eslint.config.mjs).
//
// Rationale: as of April 21, 2026 the codebase audited clean of
// raw image tags (all iconography uses emoji + role="img"). This
// component exists so when raster assets DO land (e.g. parent avatar
// uploads, cosmetic art, game screenshots), there's a single surface
// to standardize them against.
// ════════════════════════════════════════════════════════════════

import Image, { type ImageProps } from 'next/image';

type Props = Omit<ImageProps, 'loading'> & {
  /** Above-the-fold / LCP images should set this to true. */
  priority?: boolean;
};

const DEFAULT_SIZES = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';

export function OptimizedImage({
  priority = false,
  sizes = DEFAULT_SIZES,
  quality = 80,
  alt,
  ...rest
}: Props) {
  return (
    <Image
      {...rest}
      alt={alt}
      sizes={sizes}
      quality={quality}
      priority={priority}
      // Never set `loading` here — next/image computes the best
      // value automatically from `priority`.
    />
  );
}

export default OptimizedImage;
