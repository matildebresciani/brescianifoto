# Client gallery validation — 2026-10-22

## Cloudflare-only commit validation — 2026-10-22

Validated an isolated HEAD snapshot containing only the Cloudflare changes, excluding concurrent gallery editor/design work. All 40 client-delivery tests pass, Payload and Next types/import map regenerate, typecheck passes, and Biome checks pass for the changed application files. This verifies the commit independently of uncommitted features; production R2 transfers remain unverified.

## Gallery folder organization — 2026-10-22

New uploads are grouped by gallery ID into photos, thumbnails and downloads. All 11 upload endpoint tests pass, covering unique keys for duplicate filenames, gallery grouping, ZIP placement, preserved original bytes and compatible new/legacy thumbnail completion. Typecheck and Biome checks on the two changed TypeScript files pass. Vitest emits the previously recorded Storybook preset warnings but completes successfully. No live R2 upload or migration was performed; deployment remains pending.

## Dedicated client bucket configuration

- Client storage now uses only `CLIENT_R2_*` variables, including its own bucket, endpoint and credentials. Images and admin thumbnails now use signed S3 URLs without a public hostname or DNS changes. Portfolio settings remain unchanged. Next image optimization accepts the client S3 endpoint scoped to the bucket/client prefix. Local QA placeholders resolve locally only in development with no client bucket configured.
- All 44 client-delivery unit tests pass, including six storage tests that check image/download routing and reject missing client configuration instead of using portfolio settings. Typecheck passes. Vitest also emitted missing Storybook builder preset warnings; these did not prevent the unit tests from running or passing.
- Production bucket creation was reported by the user. Token/CORS/lifecycle/private-bucket configuration, deployment and a live R2 round trip are not yet verified. No DNS, nameserver or remote bucket changes were made.

## DIF / native Payload refactor

- 34 focused unit tests pass (31 delivery tests plus 3 upload-selection tests), including palette references following gallery edits, legacy custom-color fallback, explicit inheritance, invalid source rejection and required custom colors.
- Type checking, app-wide Biome lint and production Webpack build passed. Browser rendering also passed with the development Turbopack bundler after the recorded plugin patch and transpile setting.
- Real local Payload integration verifies old external records expose native upload metadata without changing IDs/keys, saves palette references, and retains publication contrast checks, ownership/access restrictions and archive revision handling.
- Browser checks: native cover thumbnail; gallery-filtered selection drawer with thumbnail rows and bulk selection; two photos added to a section; section palette roles saved and present after reload; plugin preset swatch updates the hex field and saves successfully.
- The picker package has an older Next peer declaration. Compatibility has been checked locally on the installed stack, not guaranteed for future upgrades. Live R2 upload/download integrity, large ZIP transfer and actual-phone acceptance remain pending.

Earlier follow-up entries below are historical; the custom color field and custom photo-library UI described there have now been replaced.

## Inline section-upload follow-up

Photo sections now share a resumable upload panel with the gallery-level photo/ZIP uploaders. Successful batch IDs are appended in file-selection order to the latest form selection; retries deduplicate IDs. Three new unit tests cover order preservation, deduplication and empty/populated relationships. Typecheck, lint and the production Webpack build pass. Browser inspection confirmed inline upload controls and that only Client galleries remains under Client delivery in the sidebar. File chooser automation timed out; no browser file transfer or live R2 success is claimed. Live transfer verification still requires storage configuration.

## Section editor follow-up

Added photo-section Lexical introductions and optional text/background overrides to text and photo blocks. All 30 delivery tests plus 3 shared RichText renderer tests pass. Real Payload integration verified stored introductions/colors, stable anchors/revisions, and publication rejection for unreadable section palettes. Browser checks verified bold/centered introduction persistence, reset-to-gallery controls, independent neighboring palettes, lightbox colors, and a 375px two-column layout without horizontal overflow. Type checking, lint, formatting and the production Webpack build pass.

## Color-picker follow-up

All five theme fields now show a clickable native color picker beside the editable hex code. Browser checks verified picker-to-hex and hex-to-picker updates, contrast feedback after selecting an unreadable color, and persistence after saving/reloading a QA draft. Type checking and lint passed.

## Completed checks

- **27 delivery unit tests passed** across five files: theme validation/contrast, photo-set revisions, signed upload sessions, attachment names, publication reads, 500-photo projection, download authorization/stale archives, original JPEG integrity and multipart upload behavior.
- JPEG fixture processing preserved the complete original buffer and SHA-256, including EXIF, XMP and ICC data. The only generated image was a separate WebP thumbnail; rotated source dimensions were handled correctly. Byte equality also protects embedded metadata formats not individually interpreted by the application. This is a local processing test, not a live R2 round-trip test.
- Multipart tests verified anonymous denial, original-vs-thumbnail writes, completion retries, missing/duplicate parts, expiry, cancellation, size limits, and a simulated 6 GiB ZIP initiation without buffering its bytes. Actual multi-gigabyte transfer is still pending.
- **Real Payload/MongoDB integration passed** in the dedicated local database `brescianifoto_client_delivery_qa`: create/publish, stable share IDs and anchors, archive revision stability when reordering, invalidation when changing photos, explicit confirmation reset, theme contrast rejection, cross-gallery photo rejection and anonymous collection denial. The repeatable script is `scripts/check-client-gallery.mts`.
- **HTTP checks passed** on the isolated QA server: noindex/no-store headers, anonymous collection denial, authenticated-only preview, published snapshot preserved during draft edits, unpublishing returning 404, republishing, and unknown download IDs returning 404.
- **Browser checks passed** at 320, 375, 768 and 1440 pixels with no horizontal overflow. The grid used two columns below 1024px and three above; the section menu switched to mobile disclosure below 768px. Mobile anchor selection and active-section state worked.
- Both cover layouts rendered; the long-title overlay fit the 375px viewport. The CMS saved a custom warm palette, preserved photo reordering, exposed alignment/heading controls, and rendered centered rich text correctly. The overlay and portal palette issues found during review were fixed.
- The photo viewer passed keyboard-arrow navigation, Escape closing and focus restoration. Its existing pointer/swipe/zoom component is reused. A physical-phone check remains pending.
- A **500-photo browser fixture** rendered 501 image elements including its cover: all 500 section images were lazy, only 15 were initially loaded near the viewport, and no browser image used an unoptimized original URL. Photos were local placeholders, not client content.
- The generated dashboard rendered correctly and its Blocked filter showed exactly the four outstanding assignments.
- Delivery-specific Biome checks and app formatting checks passed. A production **Webpack build passed** with a dedicated QA database and placeholder R2 settings, confirming compilation/routing but not storage deployment. The initial sandboxed Turbopack build stalled and was stopped.

## Repository-wide results

The full unit suite most recently reported **177 passing tests and one failing test**. The failure is the existing `gallery-page-metadata.test.ts` expectation of a middle dot before the image count, while the checked-in formatter uses a slash. This discrepancy was verified in the original HEAD files and is not caused by client delivery.

Final whole-app **type checking, lint and formatting pass**, and the production Webpack build passed again after the final implementation changes. Separate public-gallery changes briefly caused type/lint failures during development; their completed fixes were picked up in the final checks without editing that work.

## Still required before production

1. Configure actual R2 credentials, CORS, scoped abandoned-multipart cleanup and asset-domain noindex headers. No R2 configuration is present in the local environment.
2. Test real JPEG upload/download hashes and metadata, large ZIP transfer/retry/cancel, interrupted native downloads and maximum-size photo processing on the actual Vercel plan.
3. Complete physical-phone and reduced-motion checks, and review the real wedding's layouts/images.
4. Resolve the existing public-gallery metadata-test mismatch through its owning work; re-run release checks after configuring production storage.
5. Deploy to the intended production project, create the actual wedding gallery from supplied content, and test signed-out delivery on the live domain. No real wedding assets or ZIP have been supplied and no production deployment or client message was sent.
