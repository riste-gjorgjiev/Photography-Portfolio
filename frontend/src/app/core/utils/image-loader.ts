import {ImageLoaderConfig} from '@angular/common';

const CLOUDINARY_UPLOAD_PATH = '/image/upload/';

/**
 * Image loader for `NgOptimizedImage`.
 *
 * Rewrites Cloudinary delivery URLs so the browser can pick a width-specific
 * variant from the generated `srcset`:
 *
 *   https://res.cloudinary.com/<cloud>/image/upload/v1/portfolio/x.jpg
 *   → https://res.cloudinary.com/<cloud>/image/upload/f_auto,q_auto,c_limit,w_640/v1/portfolio/x.jpg
 *
 * `f_auto` lets Cloudinary negotiate WebP/AVIF, `q_auto` keeps quality sensible
 * and `c_limit` never upscales beyond the original.
 *
 * Any other URL (picsum demo images, data URIs, a future CDN) is returned
 * untouched so this stays a no-op outside Cloudinary.
 */
export function portfolioImageLoader(config: ImageLoaderConfig): string {
  const {src, width} = config;

  if (!width || !src.includes(CLOUDINARY_UPLOAD_PATH)) {
    return src;
  }

  const [base, rest] = src.split(CLOUDINARY_UPLOAD_PATH);

  return `${base}${CLOUDINARY_UPLOAD_PATH}f_auto,q_auto,c_limit,w_${width}/${rest}`;
}
