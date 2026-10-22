# Image optimization and cache writes

The public image domain and Vercel's image optimizer have separate caches. Cloudflare caches source files; Vercel caches requested size/quality/format variants. Moving public images from `r2.dev` to `photos.brescianifoto.dk` causes new variants to be cached as they are viewed. Keep the hostname stable after that cutover.

## Application behavior

- Public media has an internal `imageVersion` independent of record timestamps. Uploading, replacing, or cropping a source changes it. Alt text, captions, localization, and display-only focal edits preserve it.
- Existing records keep their exact timestamp-qualified URL. Their previous timestamp is pinned on the first metadata-only edit; there is no bulk backfill or photo migration.
- Image sizing follows each layout's columns, container padding, gaps, and maximum width. The generic fallback is `100vw`; fitted lightbox sizes increase only on explicit zoom. Keep the existing width candidates. Client delivery grids, full-screen photos, and matching next-photo preloads use quality 90 to preserve fine photographic detail; covers, thumbnail strips, and public portfolio views retain quality 75. Next.js allows both quality values. Delivery grids retain responsive viewport-based fallback sizes and request the full object-cover image width after layout, accounting for cropping and taller bottom tiles. The browser applies screen pixel density to that width.
- Lightboxes reserve the incoming photo's fitted area with a CSS skeleton. They do not request a tiny loading preview. The thumbnail navigation strip remains available. Failed main images offer manual retry.
- Only the next slide is preloaded, 200ms after the current fitted image loads. Speculative requests are sequential, deduplicated, and skipped on data-saving/very slow connections. Queued requests stop on navigation or close.
- Client images keep their S3 signed URL unchanged: appending cache parameters invalidates signatures. Their internal image version is derived from the existing immutable photo ID/checksum. Half-day signing windows reuse source URLs between page loads while retaining the 24-hour maximum source-link lifetime. Original and ZIP downloads remain at 15 minutes.

## Public-source cache rules after the domain migration

Enable longer public caching only after the file-version lifecycle above is deployed and replacement uploads have been verified. Do not raise the global Next image cache lifetime for private client galleries.

1. Confirm `photos.brescianifoto.dk` is active and Vercel uses it through `R2_PUBLIC_URL`.
2. Scope the Cloudflare Cache Rule to this hostname and `/media/` only. Keep the full query string in the cache identity. Set successful image responses to a 31-day edge TTL (`2678400` seconds); do not extend caching for failures or redirects.
3. Add a response-header transform, scoped to successful image responses on that same hostname/path, setting `Cache-Control: public, max-age=2678400`. This advertises the source lifetime to browsers and Vercel. A response-header transform alone does not configure Cloudflare's own edge TTL.
4. Verify a representative JPEG's headers and Cloudflare cache status with a repeat GET. Verify Vercel's optimized output independently. Confirm replacing a file produces a new URL and new photo, while a caption-only edit keeps the image URL.
5. Keep the old development hostname available until the new domain and deployed paths are verified. Do not purge all cached photos or prewarm the entire library.

The private client bucket, signed endpoints, delivery pages, and downloads are outside these public-host rules. Do not enable a public custom domain on the client bucket.

## Validation and measurement

Run app TypeScript checks, focused image-version/signing/read unit tests, and the lightbox/gallery browser suites. Browser coverage checks skeleton geometry, no extra preview image, next-only preloading, rapid navigation, errors/retry, zoom, gestures, focus, and reduced motion.

Record the hostname cutover and application deployment times. Compare project-level image transformations and cache write units against traffic for seven days, separating first-time cache warming from recurring work. The earlier usage spike remains unconfirmed; client galleries were not deployed at that time. Reconsider upload-time variants or fewer width candidates only if the measured recurring usage still warrants them.
