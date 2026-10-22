# Client gallery validation — 2026-10-22

## Photo spacing preference — 2026-10-22

- Added **Overview → Appearance → Photo spacing** with native options 0, 2, 4 and 8px. The choice applies horizontally and vertically to all photo sections at every viewport. Missing/null legacy values retain 2px; zero remains zero. A saved preference change immediately remeasures the grid while retaining normal tile ratios and a straight bottom edge.
- Twenty-nine focused unit tests and eight Chromium tests pass. Dark-background browser coverage switches through every gap at mobile, tablet and desktop widths, then combines 8px with three desktop columns. Existing order, viewer, resizing and 500-photo checks still pass. Payload types regenerate; TypeScript and scoped Biome checks pass.
- The isolated `scripts/check-client-gallery-layout.mts` fixture saves/reloads all eight desktop-column/spacing combinations and checks visitor projection, stable share IDs, unchanged photo revisions and the four-column/2px defaults. No production records or original images were modified.

## Desktop column preference — 2026-10-22

- Added **Overview → Appearance → Desktop photo columns**, with native Payload options for three or four columns. Four remains the new/legacy default. The gallery-wide choice applies from 1280px, preserving existing mobile/tablet layouts, 2px gaps, normal crop ratios and the straight bottom edge.
- Twenty-three focused unit tests and seven Chromium tests pass, including null/missing legacy preferences, both saved values, responsive behavior and switching both directions without resizing the container. Payload types regenerate successfully; TypeScript and scoped Biome lint/format checks pass.
- The repeatable `scripts/check-client-gallery-layout.mts` fixture passes against the dedicated loopback database `brescianifoto_client_layout_qa`: native default four, save/reload three and four, frontend projection, unchanged share IDs and photo/ZIP revision. No production records or original files were modified. No data migration is needed.

## Masonry with aligned bottom — 2026-10-22

- Following the photographer's reference and permission to crop grid previews, client sections now use equal-width masonry instead of justified rows. Both gaps are 2px. Columns switch from two to three at 768px and four at 1280px. Normal previews use 4:3 for landscapes/squares and 3:4 for portraits; object-cover preserves photo colors without stretching. Only final tile heights change to create a common bottom, keeping at least 75% of their normal height. Full viewer images and originals retain their source proportions. Public portfolio galleries are unchanged.
- Nine focused masonry unit tests pass, covering shortest-column order, equal widths, gaps, normal tile ratios, bottom alignment, single images, small/empty/unmeasured galleries, wide panoramas, original dimension preservation and 500-photo sequences.
- Five Chromium browser tests pass at 320, 375, 768, 1024, 1280 and 1440px. They verify equal column widths, normal crop ratios, straight bottom, horizontal/vertical gaps, saved DOM order, no overflow, container resizing, a breakpoint change at fixed container width, single-photo sizing, keyboard order, correct lightbox/download indices, focus return and 500 lazy photos with static reduced-motion states. Native image fixtures isolate layout from the Next image server and remote storage.
- TypeScript and scoped Biome lint/format checks pass. The test runner still emits the existing missing Storybook Webpack preset warnings; the selected unit and browser suites complete successfully.

## Editor cleanup — 2026-10-22

- Palette rows and selectors show swatches and uppercase hex values; internal color variables are hidden. Only semantic names such as `bg-base` and `fg-base` remain visible. Names are hidden and optional; legacy names and references remain compatible. Semantic assignments are grouped as Background, Text and Border. Section labels use live titles/counts or text excerpts.
- Removed routine descriptions and successful contrast messages. Kept upload constraints, actionable errors and archive confirmation guidance.
- 71 focused tests pass across 12 files. The local color integration fixture passes, including nameless creation, hex edits/reordering/reload, legacy appearance, reference protection and publication contrast. The unit runner still reports the existing missing Storybook preset warnings.
- Browser checks at 1440px and 375px verify nameless creation, keyboard color selection, two assignments updating from one hex edit, draft save/reload, live section title/count/excerpt labels and warnings for invalid contrast. No browser runtime errors occurred. Gallery fields fit the narrow viewport; Payload's existing top account/date controls extend beyond it.

## Upload-once photo library — 2026-10-22

- Added the gallery-specific Photo library tab with bulk upload, an authenticated count and the existing Media gallery grid/list browser. Photo sections reuse the existing sortable GalleryField. Existing uploads appear without a data migration; unsaved galleries have empty photo-picker filters.
- 68 focused unit tests pass, including the read adapter test that keeps full-resolution originals separate from plugin thumbnails. The unit runner emits pre-existing missing Storybook builder preset warnings, but the unit suite completes successfully.
- The isolated MongoDB integration script passes with additional checks for library-only photos, paginated membership and unchanged delivery revisions. Existing ownership/access and ZIP revision checks also pass.
- Browser checks pass for gallery-filtered bulk selection, preserving existing selection order, keyboard grid reordering, grid/list switching, draft save/reload, independent section order, retaining originals after removing a section selection, library count, search, pagination and full-resolution lightbox previews.
- Mocked browser transfers verify a three-file batch with one failure, retrying just that file, refreshing the count after each completed batch/retry, and leaving section selections and revisions unchanged. New galleries require a draft save before library upload. These are simulated transfers; a live R2 round trip was not performed.
- The versioned Media gallery plugin patch fixes lightbox stacking above Payload drawers and honors disabled editing in the lightbox. For editable collections, opening Quick edit closes the lightbox before opening the document drawer. The patch is recorded in package.json and pnpm-lock.yaml; frozen lockfile validation passes.
- Payload import map/types regenerated; TypeScript and targeted Biome checks pass.


## Project journal reconciliation — 2026-10-22

The journal was reconciled with this file, the working tree and recent implementation chats. CG-14 records the completed local Overview/Details/social-preview checks below. CG-15 tracks the active Photo library work, including drawer lightbox stacking and disabled-editing compatibility issues found during browser QA. CG-16 records the later request for a single unified native Featured image field; that correction has no completed acceptance evidence yet. Earlier completed editor tasks retain their original scope.

CG-03, CG-09, CG-11 and CG-12 remain Blocked. The deployment investigation identified Production-only Vercel environment scope as the cause of the failed Preview build; enabling Preview scope and redeploying were advised, but no successful redeployment was recorded. Dedicated bucket creation does not verify credentials, CORS/lifecycle or actual transfers. Test totals below describe separate runs and snapshots; this journal update did not rerun application tests or verify remote configuration. The task JSON and generated dashboard were validated by the journal generator.

## Visible publication requirements — 2026-10-22

Featured image and Page sections now use Payload’s standard red required asterisk, with plain labels. Publication-aware validation keeps drafts saveable without images. Missing image publication failures use Payload field validation errors with readable labels, rather than a generic API error. The isolated integration script verifies both error paths and successful empty draft saves. Earlier browser verification confirms inline errors in Overview/Page sections, and saving a draft edit after rejected publication. Typecheck and app-wide lint/format checks pass. This changes requirement visibility, not the publication rules.

## Cloudflare-only commit validation — 2026-10-22

Validated an isolated HEAD snapshot containing only the Cloudflare changes, excluding concurrent gallery editor/design work. All 40 client-delivery tests pass, Payload and Next types/import map regenerate, typecheck passes, and Biome checks pass for the changed application files. This verifies the commit independently of uncommitted features; production R2 transfers remain unverified.

## Gallery folder organization — 2026-10-22

New uploads are grouped by gallery ID into photos, thumbnails and downloads. All 11 upload endpoint tests pass, covering unique keys for duplicate filenames, gallery grouping, ZIP placement, preserved original bytes and compatible new/legacy thumbnail completion. Typecheck and Biome checks on the two changed TypeScript files pass. Vitest emits the previously recorded Storybook preset warnings but completes successfully. No live R2 upload or migration was performed; deployment remains pending.

## Reusable palette colors — 2026-10-22

- Replaced required highlight pairs with independently named colors. Each hex is defined once and reused by semantic tokens and section background/text selections. Existing palettes are deduplicated on read before Payload field defaults run; legacy pair references and automatic foregrounds keep their appearance.
- All 67 focused tests pass across 11 files, including 13 theme tests for reusable colors, live resolution, stable rename/reorder keys, legacy deduplication, missing/referenced colors, incomplete rows and contrast. Vitest emitted the existing Storybook preset warnings without affecting the unit run.
- `scripts/check-client-gallery-colors.mts` passes against the isolated local QA database: create/save/reload, old document and draft-version conversion, unchanged legacy appearance, new-section inheritance, independent selections, rename/reorder stability, deletion protection for semantic tokens and sections in drafts and published documents, and publication contrast rejection.
- Browser checks pass for adding a color with only a name and hex, reuse across multiple semantic tokens, live updates, independent section text, keyboard dropdown selection, name/swatch/uppercase-hex rendering, hidden stable keys and save/reload. Live gallery and section contrast feedback also passes after handling Payload’s hidden legacy array state. Mobile/desktop checks at 375px/1440px verify alternating sections, matching lightbox colors, Escape closing and no horizontal overflow, using local placeholder photos.
- Payload types/import map regenerated; typecheck, app-wide lint/format checks and production Webpack build pass. Build uses isolated QA data and placeholder storage settings. Existing production-storage and physical-phone release blockers remain unchanged.
- OPERATIONS.md and CG-13 now describe defining the four example colors once and reusing them. The earlier pair implementation below is historical and superseded by this simpler editor.

## Gallery tokens and highlight pairs — 2026-10-22

- 48 focused tests pass (45 client-delivery tests plus 3 upload-selection tests). Added semantic tokens and repeatable highlight pairs while retaining original theme fields and legacy section behavior. Tests cover key generation/rename/reorder, automatic foregrounds, explicit overrides, invalid/deleted references, incomplete new editor rows and contrast of actual rendered combinations.
- `scripts/check-client-gallery-colors.mts` passes with the isolated `brescianifoto_client_colors_qa` database. It verifies saved pairs, new-section defaults, legacy records and draft versions, stable keys, referenced-highlight deletion rejection in drafts and published documents, and unreadable section publication rejection.
- Browser checks pass for live palette edits, creating a named pair, stable read-only keys, keyboard dropdown selection, token/swatch/hex rendering, automatic foreground updates and save/reload. Preview checks at 375px and 1440px verify separate orange/green sections, no horizontal overflow, matching portal backgrounds/text and Escape closing. Only local placeholder photographs were used.
- Payload types/import map regenerated. Whole-app type checking, lint and formatting pass. Production Webpack build passes using the local QA database and non-secret placeholder storage settings; this does not verify production storage.
- The optional orange/pistachio/green gallery configuration is documented in OPERATIONS.md. Neutral defaults and the public portfolio palette remain unchanged. Existing storage, physical-phone and first-delivery release blockers remain open.


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

1. Verify dedicated client R2 credentials, CORS, private bucket access and scoped abandoned-multipart cleanup in the intended deployment. The bucket is recorded as created, but remote configuration and live transfers are unverified. Verify application noindex headers on delivery and optimized-image responses; signed S3 access needs no custom asset domain. Ensure portfolio and client variables are available to the intended Vercel environment, then redeploy successfully.
2. Test real JPEG upload/download hashes and metadata, large ZIP transfer/retry/cancel, interrupted native downloads and maximum-size photo processing on the actual Vercel plan.
3. Complete physical-phone and reduced-motion checks, and review the real wedding's layouts/images.
4. Resolve the existing public-gallery metadata-test mismatch through its owning work; re-run release checks after configuring production storage.
5. Deploy to the intended production project, create the actual wedding gallery from supplied content, and test signed-out delivery on the live domain. No real wedding assets or ZIP have been supplied and no production deployment or client message was sent.

## Featured image / Overview follow-up — 2026-10-22

- Renamed Cover to Overview and its image field to Featured image. Appearance is collapsed; Details uses the shared delivery Lexical editor and frontend rich-text renderer.
- Native Payload Dropzone/buttons now wrap direct photo transfers. Featured image is single-file; sections retain batch upload and native selection/reordering. Payload EditUpload provides visual, non-destructive focal adjustment.
- 59 focused delivery/upload tests passed, including new Details conversion, social metadata, image rendering/color/source-byte preservation, crop geometry, and route access/error tests. Typecheck passed. Biome passed for the 16 isolated implementation files; the full app lint run initially passed, then reported concurrent color-library edits in `theme.ts` and `galleries.ts` outside this change's hunks.
- Browser QA in the isolated local fixture confirmed Overview, rich-text Details save/reload, focal 0/100 save/reload, Cancel discarding an edit, gallery-filtered native selection, replacement resetting focal position to 50/50, and section upload controls. The featured-image file input is single-file. No live R2 upload is claimed.
- Actual MongoDB QA passed: dry run leaves strings untouched, an owner-only backup precedes conversion of current and version records, timestamps are retained, repeated runs find no strings, and restored versions retain rich text. Only `brescianifoto_client_delivery_qa` was migrated.
- Actual local HTTP checks passed: published Open Graph metadata contains the revision-qualified social-image URL; the route serves a 1200×630 JPEG with no-store headers; preview and invalid-link requests return 404.
- Production Webpack build passed using placeholder portfolio-storage settings, the isolated QA database, and `.next-overview-build`. This confirms compilation, not a production storage deployment. Generated Payload types/import map were refreshed.
- Production conversion/deployment and live R2 transfer verification remain rollout steps; commands and backup/recovery notes are in OPERATIONS.md.
