# Client gallery delivery

## How to resume

Read this file before starting a gallery task. Update task status, notes and verification evidence in the `client-gallery-tasks` JSON block below, then run `node scripts/render-client-gallery-plan.mjs` from the repository root. Open `dashboard.html` locally. It is generated and must not be edited independently. Mark tasks Done only when every acceptance criterion is verified. Record environmental blockers honestly.

## Accepted specification

Build an unlisted, editorial wedding gallery experience at `/deliveries/<unique-link>`, managed in Payload, hosted on Vercel and Cloudflare R2. Support up to 500 edited JPEGs, custom colors with the existing Instrument Serif/Archivo/IBM Plex Mono fonts, independent rich-text and photo-section blocks, original individual downloads and a manually uploaded ZIP. No passwords or accounts for recipients. Issued signed URLs and cached/downloaded copies can remain accessible after unpublishing. Domain registration, DNS and nameservers stay at Simply. The dedicated client R2 bucket uses signed image/download URLs without a custom domain.

### Independent client area

Separate `client-galleries`, `client-photos`, and `client-downloads` collections from public portfolio galleries and media. Admin-only collection APIs; public pages explicitly project only visitor fields. Stable unpredictable share IDs. Draft/unpublished and invalid links return generic 404s; authenticated preview is available. Independent delivery layout, outside portfolio navigation and locale routing. Exclude all client content from navigation, archives, automatic mixes, public collection listings and sitemaps. Emit noindex on pages and file responses where served; allow crawlers to read page noindex. Link access is unlisted, not authenticated privacy.

### Authoring

Internal name, public title, cover, subtitle, optional date/location/details, theme, ordered blocks, download settings and share link. Cover layouts: text above image (default) or full-width image with text over it; left/center/right alignment, focal point and neutral overlay. Rich text: paragraphs, H2–H4, bold/italic/underline, links, ordered/unordered lists and alignment. Shared fluid typography, no arbitrary inline font sizes. Photo blocks: required title, optional menu label, immutable anchor, ordered photos. Bulk upload/select/reorder and move photos between sections. Omit empty sections from visitor page/menu.

Each photo section also has an optional Lexical introduction above its photographs. Both text and photo blocks choose background/text colors from the gallery palette, inherit the corresponding gallery role, or use a custom hex color with a visual picker. Palette references follow later gallery color changes; existing hex overrides remain compatible. Section palettes apply to supporting text and the photo viewer, with publishing contrast validation. The Lexical editor includes standard text formatting, H2–H4, alignment, indentation, ordered/unordered/check lists, quotes, links and dividers; client images remain managed through photo sections.

### Presentation

Default bone/void palette, customizable background/surface/text/muted/border roles via validated CSS variables. Buttons derive from the palette. Scoped theme includes portal lightboxes. Show contrast feedback and prevent unreadable published combinations. Preserve original photo colors and full images in the viewer/downloads. Client grids use equal-width masonry columns with 2px horizontal/vertical gaps: two columns below 768px, three below 1280px, four on wide screens. Landscape/square previews use 4:3 and portrait previews use 3:4, with object-cover cropping. Place saved photos into the shortest column, resolving ties left to right; retain saved DOM, keyboard and viewer order. Only the last tile in each occupied column changes height to share a straight bottom edge, retaining at least 75% of its normal height. Reflow on container resize. This supersedes the earlier justified-row proposal. Public portfolio galleries retain their separate layout. Sticky desktop menu with active section, expandable mobile menu showing current section, anchor deep links, keyboard navigation, sticky offset and reduced motion. Minimal branding/footer, no portfolio navigation.

Desktop photo density is selectable per gallery under **Overview → Appearance → Desktop photo columns**: three or four columns at 1280px and above. Four remains the default for new and legacy galleries. The choice applies to every photo section; below 1280px the existing two-column mobile/three-column tablet layout remains. Changing the preference remeasures without requiring a viewport resize and does not change photo order, the shared link, or ZIP revision. No database migration is required.

The adjacent **Photo spacing** select offers 0, 2, 4 or 8px, applied horizontally and vertically to every photo section at every viewport. Two pixels remains the default for new/legacy galleries. Zero means no gap and must not fall back to the default. Changing spacing remeasures immediately and retains the straight bottom edge, gallery link, and ZIP revision. The earlier fixed-2px requirement is now the default, rather than the only spacing.

### Uploads and downloads

Unpredictable isolated R2 object keys; original names retained for attachment downloads. Original JPEG bytes never resized/recompressed/rewritten; generate admin thumbnail separately. Responsive Next image optimization with WebP, dimensions and lazy loading; prioritize cover; load lightbox previews on demand. Bulk upload bounded concurrency, progress, per-file errors and idempotent retries. Direct R2 multipart ZIP upload with retry/cancel/completion verification and abandoned-upload cleanup. Original/ZIP downloads go straight to storage with attachment headers, never buffered in browser JS or Vercel. Preserve existing EXIF/IPTC/XMP/color profiles. Show ZIP size; bind ZIP to a photo-set revision. Photo add/replace/remove makes ZIP stale and hides Download all until replacement or explicit photographer confirmation. Reordering alone does not invalidate the archive.

### Release criteria

Verify isolation, editor persistence/order/anchors, 320/375/768/1440px layouts, long titles, both cover layouts, mixed photo proportions, custom palettes, keyboard/focus/zoom/contrast/reduced motion. Test 500-photo behavior, offscreen lazy loading, no original/ZIP downloads during browsing. Compare original hashes and metadata. Test upload failures/retry/cancel/duplicate names and multi-gigabyte ZIPs. Run relevant tests, typecheck, lint, format and build. Configure production CORS/lifecycle/noindex headers, deploy and check the supplied first gallery on production and an actual phone. Photographer supplies photos, text, cover and ZIP; client messaging is manual.

### Deferred

Automatic ZIP creation, selectable fonts, passwords, favorites/proofing, print sales, client accounts and RAW/TIFF delivery.

## Decisions and implementation notes

- 2026-10-21: Scope accepted by photographer. Vercel + R2 confirmed.
- Use dedicated client asset records and signed direct R2 uploads so Payload image processing cannot rewrite original files. The public portfolio media pipeline remains unchanged.
- Client pages and optimized image responses emit noindex. Client objects stay in a private R2 bucket and are served with signed S3 URLs; no Cloudflare domain/header setup or DNS move is required.
- Progress is derived from the records below; this dashboard is never deployed with the photography site.

## DIF comparison — architecture review (2026-10-21)

The photographer asked to compare the implementation with the local DIF project and reduce unnecessary custom Payload UI. Read-only inspection confirmed:

- DIF uses `@innovixx/payload-color-picker-field` through a reusable field template. It also has small custom palette-select and Lexical color adapters built on Payload UI, plus a local plugin patch for alpha colors.
- DIF stores named background/foreground palette roles and maps them to CSS variables. Sections select roles rather than repeating hex values. For client galleries, apply the same pattern per gallery, not globally across every client's gallery. Retain optional custom section overrides from the accepted requirements.
- This repository already uses the official `@payloadcms/storage-s3` adapter with direct client uploads, as well as `@sitebytom/payload-media-gallery` for the public media collection. The gallery plugin enhances collection browsing; it is not automatically a replacement for per-section selection/order.
- The current client editor already uses native Payload blocks, tabs, fields, drafts and Lexical. Custom photo selection/upload UI and color controls can be simplified further. Native upload collections/fields should be evaluated for client JPEGs, retaining separate client asset ownership, private collection access and verified original-byte preservation.
- The installed S3 client-upload handler uses a single PUT. The large ZIP multipart/resume flow, archive revision checks and publication/isolation rules still need feature-specific handling unless a replacement demonstrably covers them.

Implemented after approval:

- Replaced the custom ColorPicker with DIF's `@innovixx/payload-color-picker-field@2.0.4`. Next transpiles its shipped JSX; a checked-in pnpm patch fixes its explicit entry path, reordered-block field paths, and swatch accessibility/read-only handling. This package declares an older Next peer; local Turbopack browser and production Webpack checks passed.
- Section background/text selectors use native Payload selects for named gallery palette roles, inheritance, or custom colors. The preview and contrast feedback resolve the current palette. Missing source fields preserve previously saved hex overrides; no destructive migration is required.
- Converted ClientPhotos to an external-backed Payload upload collection, keeping authenticated reads and completion-endpoint-only writes. Read hooks adapt existing records to native filename/size/URL/thumbnail fields without moving, re-encoding, or renaming originals.
- Cover and photo sections use native upload fields, thumbnail rows, gallery-filtered bulk selection and sortable ordering. Removed the bespoke PhotoPicker, its library endpoint and obsolete CSS. Upload a cover directly in the Cover tab.
- The small PhotoUpload extension only connects the resumable transfer panel to Payload's selected IDs. Direct multipart photo/ZIP transfers remain custom: they provide bounded concurrency, progress, retries/cancellation, random storage keys, original-byte validation and gallery ownership. Native UI is reused without substituting a different storage pipeline. Public portfolio uploads remain unchanged.

Acceptance evidence is recorded in VALIDATION.md. Production R2 round-trip and phone/release blockers remain open.

## Gallery tokens and reusable colors — 2026-10-22

Implemented gallery-focused DIF naming: `bg-base`, `bg-subtle`, `bg-invert`, `fg-base`, `fg-faded`, `fg-on-color`, and `border-base`. Following the photographer’s correction, the pair editor is replaced by **Palette colors**: each entry has a name and a single hex value. Semantic tokens and section background/text fields independently reference these colors. The dropdowns show names, swatches and uppercase hex values, reflecting unsaved edits everywhere a color is reused. New sections inherit the gallery colors.

The five original storage fields remain compatible. Existing palettes convert into a deduplicated library before Payload applies new-field defaults; existing pair references and automatic text remain supported. Rename/reorder preserve stable references. Referenced colors cannot be removed in drafts or published galleries. Publishing checks resolved section and control contrast. Neutral defaults and portfolio colors remain unchanged. The orange/pistachio/green recipe defines four colors once in an individual gallery; no preset or global change is applied.

## Validation and handover

See [VALIDATION.md](./VALIDATION.md) for test evidence and [OPERATIONS.md](./OPERATIONS.md) for setup and photographer instructions. The feature code is implemented; tasks awaiting real storage/launch verification remain Blocked instead of being marked complete.

## Task records

```client-gallery-tasks
[
  {
    "id": "CG-01",
    "title": "Persistent plan and dashboard",
    "description": "Persist the specification and machine-readable task records. Generate a standalone dashboard with progress, filters, dependencies and next task.",
    "dependencies": [],
    "status": "Done",
    "acceptance": [
      "Persist the specification and machine-readable task records.",
      "Generate a standalone dashboard with progress, filters, dependencies and next task."
    ],
    "notes": [
      "Plan, operations guide, repeatable QA script and standalone dashboard are saved in the repository."
    ],
    "evidence": [
      "Dashboard generated from this JSON; schema/dependencies validated by generator.",
      "Browser verified the rendered dashboard and Blocked filter (four matching task cards)."
    ],
    "updatedAt": "2026-10-21"
  },
  {
    "id": "CG-02",
    "title": "Data model and access",
    "description": "Separate client collections with admin-only access and gallery ownership. Stable unpredictable share IDs; no portfolio migration.",
    "dependencies": [
      "CG-01"
    ],
    "status": "Done",
    "acceptance": [
      "Separate client collections with admin-only access and gallery ownership.",
      "Stable unpredictable share IDs; no portfolio migration."
    ],
    "notes": [
      "Separate admin-only collections, immutable assets, stable share IDs and generated Payload types."
    ],
    "evidence": [
      "Real local Payload integration: create/publish, ownership rejection and anonymous collection denial passed."
    ],
    "updatedAt": "2026-10-21"
  },
  {
    "id": "CG-03",
    "title": "Photo upload pipeline",
    "description": "Bounded bulk JPEG upload with progress, cancellation, retry and isolated R2 keys. Original bytes and metadata preserved; separate thumbnail; checksum recorded.",
    "dependencies": [
      "CG-02"
    ],
    "status": "Blocked",
    "acceptance": [
      "Bounded bulk JPEG upload with progress, cancellation, retry and isolated R2 keys.",
      "Original bytes and metadata preserved; separate thumbnail; checksum recorded."
    ],
    "notes": [
      "Implementation complete. Live JPEG integrity and maximum-size processing checks remain blocked until the intended deployment has working dedicated client storage.",
      "JPEG upload controls now live inside each Photo section and automatically append successful files. Gallery-library and ZIP uploads share the same progress/retry panel. Live R2 verification is still required.",
      "2026-10-22: New objects are grouped under client-deliveries/<gallery-id>/photos, thumbnails and downloads. Gallery IDs keep paths stable across renames; unique object filenames prevent collisions. Existing objects and older multipart sessions retain compatible paths; no remote migration performed.",
      "2026-10-22 journal review: dedicated bucket creation is recorded, but successful live transfers are not verified. Next verify environment scope and deployment, then JPEG upload/download hashes, metadata, retry/cancel and maximum-size processing."
    ],
    "evidence": [
      "Unit tests cover preserved source bytes and EXIF/XMP/ICC, SHA-256, separate thumbnails, multipart completion/idempotency/cancel and size limits.",
      "Gallery-folder follow-up: all 11 upload endpoint tests pass, including same-name uniqueness, gallery grouping, ZIP folder placement and new/legacy thumbnail completion. Typecheck and changed-file Biome checks pass."
    ],
    "updatedAt": "2026-10-22"
  },
  {
    "id": "CG-04",
    "title": "Gallery editor",
    "description": "Ordered rich text and named photo blocks; alignment, H2–H4, lists and links. Hero, theme and download controls; gallery-only photo selection and ordering.",
    "dependencies": [
      "CG-02"
    ],
    "status": "Done",
    "acceptance": [
      "Ordered rich text and named photo blocks; alignment, H2–H4, lists and links.",
      "Hero, theme and download controls; gallery-only photo selection and ordering."
    ],
    "notes": [
      "Gallery editor includes cover, rich text, photo blocks, thumbnail picker, ordering, colors and archive confirmation.",
      "2026-10-22: Use native red required asterisks on Featured image and Page sections, with native field-level validation errors. Empty drafts remain saveable.",
      "Added native visual color pickers beside each hex field; no extra plugin dependency.",
      "Added optional photo-section Lexical introductions and per-block background/text overrides with inherit/reset controls. Expanded both editors to the standard Lexical text-formatting features.",
      "Simplified the workflow to Client galleries: underlying photo/ZIP collections are hidden from the sidebar. Added direct section uploads and an optional cover/library uploader.",
      "DIF follow-up implemented: plugin color picker, palette-role section colors, native Payload cover/photo selection and sorting; removed custom PhotoPicker. Existing records/hex overrides stay compatible. Resumable transfer panel retained.",
      "2026-10-22 journal review: original editor scope is complete. Track the Overview/social-preview follow-up in CG-14, the active upload-once photo-library workflow in CG-15, and the requested unified featured-image field in CG-16."
    ],
    "evidence": [
      "Browser: palette edits saved; photo order persisted; text alignment controls present; centered rich text rendered correctly.",
      "2026-10-22: Local integration and browser checks confirm image requirements, field-level errors for missing featured/section photos, and empty draft saving. Typecheck and lint/format pass.",
      "Browser verified both directions of hex/swatch synchronization, immediate contrast feedback, and saved values after reload. Typecheck and lint passed.",
      "Real Payload save/read preserved nested rich text and colors; publication rejected low-contrast section colors. Browser verified bold editing, saving, preview, palette reset and color feedback.",
      "Browser confirmed inline section upload controls and gallery-only client navigation. Three merge tests verify current-order preservation, retry deduplication, and empty/populated sections. Actual file transfer remains pending R2 setup.",
      "34 focused tests pass; native metadata/palette compatibility exercised with real local Payload. Browser confirmed thumbnail bulk picker, palette roles and plugin swatch changes; typecheck, lint and production Webpack build passed.",
      "Latest local Overview verification is recorded in VALIDATION.md; photo-library compatibility fixes are still active and are not counted as completed acceptance."
    ],
    "updatedAt": "2026-10-22"
  },
  {
    "id": "CG-05",
    "title": "Delivery layout and theme",
    "description": "Independent /deliveries route outside locale navigation. Existing fonts, scoped colors, contrast checks and themed lightbox.",
    "dependencies": [
      "CG-02"
    ],
    "status": "Done",
    "acceptance": [
      "Independent /deliveries route outside locale navigation.",
      "Existing fonts, scoped colors, contrast checks and themed lightbox."
    ],
    "notes": [
      "Separate delivery root layout and locale exclusion; scoped semantic and Tailwind palette variables also apply to portal dialogs."
    ],
    "evidence": [
      "320/375/768/1440px browser checks showed no horizontal overflow. Custom palette saved and rendered correctly."
    ],
    "updatedAt": "2026-10-21"
  },
  {
    "id": "CG-06",
    "title": "Cover and introduction",
    "description": "Editorial and overlay cover layouts with alignment, focal point and optional details. Responsive dimensions and reduced motion.",
    "dependencies": [
      "CG-04",
      "CG-05"
    ],
    "status": "Done",
    "acceptance": [
      "Editorial and overlay cover layouts with alignment, focal point and optional details.",
      "Responsive dimensions and reduced motion."
    ],
    "notes": [
      "Editorial and overlay covers implemented, with focal points and responsive long-title wrapping.",
      "2026-10-22: Overview now contains Featured image, rich-text Details and collapsed Appearance settings. Visual focal editing and social previews are recorded separately in CG-14."
    ],
    "evidence": [
      "Both layouts checked in browser; long-title overlay fits at 375px; neutral overlay text contrast repaired during QA.",
      "VALIDATION.md records Details and focal-point save/reload, cancellation, replacement reset and both local social metadata/image checks."
    ],
    "updatedAt": "2026-10-22"
  },
  {
    "id": "CG-07",
    "title": "Sections and navigation",
    "description": "Equal-width masonry with 4:3/3:4 cropped previews, 2px gaps, an aligned gallery bottom and lazy loading. Stable saved order and anchors; sticky desktop menu and expandable active mobile section menu.",
    "dependencies": [
      "CG-03",
      "CG-04",
      "CG-05"
    ],
    "status": "Done",
    "acceptance": [
      "Equal-width masonry uses 4:3 landscapes and 3:4 portraits, adjusting only final tile heights for an aligned bottom; preserve saved order, lazy previews and full viewer images. Payload offers per-gallery choices of three/four desktop columns and 0/2/4/8px spacing, defaulting to four columns and 2px.",
      "Stable anchors; sticky desktop menu and expandable active mobile section menu."
    ],
    "notes": [
      "2026-10-22: Photographer replaced the justified-row proposal with reference-style masonry and authorized object-cover grid crops. CSS variables define 2px gaps, 2/3/4 columns and 4:3/3:4 ratios. Only final tiles adjust for the common bottom; DOM and lightbox retain saved indices. Portfolio galleries are unchanged.",
      "Section introductions render above the photos. Colors are scoped to their block and lightbox; adjacent sections inherit the gallery normally."
    ],
    "evidence": [
      "500-photo browser fixture: 501 images including cover, 500 lazy images, 15 initially loaded, zero original images loaded directly; mobile anchor navigation passed.",
      "Earlier masonry browser checks covered dark section/light text, centered bold introduction, unaffected neighbor, lightbox palette, and 375px layout without horizontal overflow.",
      "2026-10-22: Nine masonry unit tests and five Chromium browser tests pass. Verified 320/375/768/1024/1280/1440px layouts, equal widths, 2px gaps, normal tile ratios, straight bottom, saved order, single-photo sizing, container/breakpoint resize, lightbox indices/download links/focus return, and 500 lazy photos with reduced motion. TypeScript passes.",
      "2026-10-22: Added per-gallery Desktop photo columns select in Overview/Appearance. Twenty-three focused unit tests and seven Chromium tests pass, including legacy defaults and changing three/four without resizing. Dedicated loopback Payload QA verifies default four, save/reload both choices, visitor projection and stable share IDs/photo revisions. Types regenerated; typecheck and scoped Biome checks pass.",
      "2026-10-22: Added Photo spacing select (0/2/4/8px, default 2). Twenty-nine unit tests and eight Chromium tests pass, including every gap on dark mobile/tablet/desktop layouts, no-gap handling, immediate remeasurement and aligned bottoms. Native Payload QA saves/reloads all eight column/spacing combinations with stable share IDs and photo revisions."
    ],
    "updatedAt": "2026-10-22"
  },
  {
    "id": "CG-08",
    "title": "Client lightbox",
    "description": "Keyboard, swipe, zoom, focus trapping and restoration. Original download action without changing public portfolio behavior.",
    "dependencies": [
      "CG-07"
    ],
    "status": "Done",
    "acceptance": [
      "Keyboard, swipe, zoom, focus trapping and restoration.",
      "Original download action without changing public portfolio behavior."
    ],
    "notes": [
      "Client lightbox reuses existing swipe/zoom image behavior and modal focus management, with original-download links."
    ],
    "evidence": [
      "Browser: keyboard arrows, Escape, focus restoration and gallery colors passed. Real-phone touch verification remains in CG-11/12."
    ],
    "updatedAt": "2026-10-21"
  },
  {
    "id": "CG-09",
    "title": "ZIP and original downloads",
    "description": "Multipart ZIP upload, retry, cancel and completion verification. Direct original and ZIP downloads with attachment names, size and stale-archive handling.",
    "dependencies": [
      "CG-03",
      "CG-04"
    ],
    "status": "Blocked",
    "acceptance": [
      "Multipart ZIP upload, retry, cancel and completion verification.",
      "Direct original and ZIP downloads with attachment names, size and stale-archive handling."
    ],
    "notes": [
      "Implementation complete. Live multipart ZIP transfer, interrupted native downloads and multi-gigabyte integrity checks await R2 configuration.",
      "2026-10-22 journal review: no successful multi-gigabyte R2 round trip is recorded. Retain Blocked until real transfer, interruption/retry/cancel and downloaded archive integrity are verified."
    ],
    "evidence": [
      "Tests cover multipart archive initiation, signature verification, recorded revision, stale ZIP rejection, download toggles and direct redirects. Real Payload checks verified reorder stability, photo-change invalidation and one-shot confirmation."
    ],
    "updatedAt": "2026-10-22"
  },
  {
    "id": "CG-10",
    "title": "Preview and publishing",
    "description": "Authenticated preview, copy link, publish validation and unpublish behavior. No indexing, public listings, sitemap or random-mix exposure.",
    "dependencies": [
      "CG-06",
      "CG-07",
      "CG-08",
      "CG-09"
    ],
    "status": "Done",
    "acceptance": [
      "Authenticated preview, copy link, publish validation and unpublish behavior.",
      "No indexing, public listings, sitemap or random-mix exposure."
    ],
    "notes": [
      "Authenticated saved-draft preview, refresh-on-save, share controls, publish validation and noindex/no-store behavior implemented.",
      "2026-10-22: Removed redundant custom draft-preview/open links in favor of Payload native preview controls. Kept Copy client link; relabeled the stable generated shareId as Slug without changing URLs or storage.",
      "2026-10-22: Published galleries now have a revision-qualified Open Graph/Twitter image derived from Featured image. Local HTTP and publication-access checks are recorded in CG-14; deployment verification remains outstanding."
    ],
    "evidence": [
      "HTTP checks passed: existing published snapshot survives a draft edit, anonymous preview denied, admin preview allowed, unpublish returns 404, republish restores gallery, invalid download denied."
    ],
    "updatedAt": "2026-10-22"
  },
  {
    "id": "CG-11",
    "title": "Acceptance testing",
    "description": "Run unit, type, lint, formatting, build and browser checks. Check 500 photos, original integrity, metadata, large ZIP, failures and responsive accessibility.",
    "dependencies": [
      "CG-10"
    ],
    "status": "Blocked",
    "acceptance": [
      "Run unit, type, lint, formatting, build and browser checks.",
      "Check 500 photos, original integrity, metadata, large ZIP, failures and responsive accessibility."
    ],
    "notes": [
      "Local automated and browser checks are recorded in VALIDATION.md. Release acceptance still needs real R2 integrity/large ZIP tests, physical-phone checks and final checks of the combined editor changes; the last recorded full suite has one pre-existing metadata-test mismatch.",
      "2026-10-22 journal review: recorded test totals belong to separate snapshots and must not be added together or presented as a fresh whole-suite result. Re-run final release checks after active editor changes finish."
    ],
    "evidence": [
      "Full suite: 177 passing / 1 existing metadata-formatting failure. All 27 delivery tests pass. Final typecheck, lint, formatting and Webpack build passed. Browser checks cover 320/375/768/1440px, both covers, theme, lightbox and a 500-photo fixture. Real local Payload/HTTP integration passed.",
      "Section follow-up: all 30 client-delivery tests and 3 shared RichText renderer tests pass; real local integration, typecheck, lint and formatting pass.",
      "Inline-upload follow-up: three additional client upload-selection tests, typecheck and lint passed. Browser inspected controls and simplified sidebar; no live storage transfer was verified.",
      "DIF refactor: 34 focused tests pass, typecheck/lint/build passed, local Payload metadata/palette checks and browser editor checks completed. No live R2 transfer claimed.",
      "VALIDATION.md records 67 focused palette tests and a separate 59-test Overview run, with local integration/browser checks and Webpack builds. The active library chat reports focused tests/typecheck and browser checks, but found drawer lightbox/Quick edit compatibility issues still being fixed."
    ],
    "updatedAt": "2026-10-22"
  },
  {
    "id": "CG-12",
    "title": "First delivery and handover",
    "description": "Production R2 CORS/lifecycle/private-bucket configuration and deployment. First supplied wedding gallery tested on the live domain and a real phone; handover documented.",
    "dependencies": [
      "CG-11"
    ],
    "status": "Blocked",
    "acceptance": [
      "Production R2 CORS/lifecycle/private-bucket configuration and deployment.",
      "First supplied wedding gallery tested on the live domain and a real phone; handover documented."
    ],
    "notes": [
      "Dedicated client bucket creation is recorded. Successful deployment, scoped credentials/CORS/lifecycle, live transfer acceptance, real wedding content and phone verification remain unconfirmed.",
      "2026-10-22: User created the dedicated client bucket. Client storage now requires CLIENT_R2_* settings and never falls back to portfolio R2_* settings. Token, CORS, lifecycle, deployment and live transfers remain pending.",
      "User explicitly keeps registration, DNS and nameservers at Simply. Use signed S3 URLs for client images/admin thumbnails and downloads, keep bucket public access disabled, and configure only the four CLIENT_R2 bucket/endpoint/credential variables. No custom domain or CLIENT_R2_PUBLIC_URL.",
      "2026-10-22 deployment investigation: the failed feat/client-galleries build could not read portfolio R2_* variables. The Vercel screenshot showed Production-only scope; Preview scope and redeployment were advised. No successful redeployment is recorded. Verify the client CLIENT_R2_* scope too."
    ],
    "evidence": [
      "Operations guide documents CORS, lifecycle cleanup, noindex headers, deployment, verification and rollback.",
      "Dedicated storage follow-up: 36 client-delivery unit tests and typecheck pass; five new tests verify client image/download routing and missing-setting rejection. Setup is documented for brescianifoto.dk/admin.",
      "Cloudflare-only commit independently validated against HEAD: 40 client-delivery tests, generated types/import map, typecheck and changed-file Biome checks pass without concurrent gallery editor/design changes.",
      "Journal review cross-checked the completed deployment-investigation chat. This is a recorded diagnosis, not direct verification of current Vercel configuration."
    ],
    "updatedAt": "2026-10-22"
  },
  {
    "id": "CG-13",
    "title": "Gallery color tokens and reusable palette colors",
    "description": "DIF-style semantic tokens and section selectors reuse independently named palette colors with live swatches and legacy compatibility.",
    "dependencies": [
      "CG-04",
      "CG-05",
      "CG-07",
      "CG-08"
    ],
    "status": "Done",
    "acceptance": [
      "Expose gallery-focused semantic tokens with unchanged neutral defaults.",
      "Define named colors once and reuse them independently for semantic tokens and section backgrounds/text; preserve stable references when renamed or reordered.",
      "Show live token names, swatches and hex values in accessible section dropdowns.",
      "Preserve legacy custom/inherited and automatic pair colors; block deletion of referenced palette colors.",
      "Verify palette persistence, scoped section/lightbox rendering, contrast, mobile layouts and build checks."
    ],
    "notes": [
      "Replaced the pair editor with reusable named colors at the photographer’s request. Existing palette hex values are deduplicated without changing appearance. The individual-gallery recipe defines four colors once; neutral defaults remain unchanged."
    ],
    "evidence": [
      "Focused unit tests cover semantic tokens, incomplete editor rows, key stability, automatic pairing, explicit overrides, legacy references, missing tokens and contrast.",
      "scripts/check-client-gallery-colors.mts passes against an isolated local MongoDB database, including legacy documents/versions, draft and published reference protection, save/reload, rename/reorder and publication contrast.",
      "Browser verified adding one independent color, reusing a color across tokens, live updates, renaming, keyboard selection, independent text, save/reload, and separate section/lightbox colors at 375px and 1440px without overflow.",
      "Payload types/import map regenerated; typecheck, app-wide lint/format checks and production Webpack build pass. Build used local QA data and placeholder storage settings, not production storage."
    ],
    "updatedAt": "2026-10-22"
  },
  {
    "id": "CG-14",
    "title": "Overview, rich-text Details and social previews",
    "description": "Simplify the gallery Overview, reuse Featured image for social previews, provide visual focal editing, and support legacy Details conversion.",
    "dependencies": [
      "CG-04",
      "CG-06",
      "CG-10"
    ],
    "status": "Done",
    "acceptance": [
      "Overview exposes Featured image and rich-text Details, with layout/alignment under collapsed Appearance.",
      "Visual focal editing persists and cancels correctly without changing original photos.",
      "Legacy Details documents and versions convert idempotently with a backup and retain restored rich text.",
      "Published social metadata uses a revision-qualified 1200×630 JPEG; invalid, preview and unavailable-gallery requests are denied.",
      "Record focused tests, browser/integration checks and a production compilation check."
    ],
    "notes": [
      "Local implementation and acceptance are recorded in VALIDATION.md. Production conversion/deployment remains part of CG-12. The later request for a single native featured-image upload field is tracked in CG-16."
    ],
    "evidence": [
      "59 focused delivery/upload tests and typecheck passed; isolated changed-file Biome checks passed.",
      "Local browser checked Details/focal save/reload, cancellation, image replacement and gallery-filtered selection.",
      "Isolated MongoDB verification covered dry run, protected backup, current/version conversion, idempotence and restored versions.",
      "Local HTTP checks verified published metadata and 1200×630 JPEG responses; production Webpack compilation passed using QA data and placeholder storage settings."
    ],
    "updatedAt": "2026-10-22"
  },
  {
    "id": "CG-15",
    "title": "Upload once, organise photos into sections",
    "description": "Add a gallery Photo library with bulk upload, live count and the existing Media grid browser; select and reorder section photos independently.",
    "dependencies": [
      "CG-04"
    ],
    "status": "In progress",
    "acceptance": [
      "Photo library appears between Overview and Page sections, with upload progress/retry/cancel, count and a gallery-filtered paginated grid browser.",
      "Existing uploads appear without migration; library-only uploads do not change selected photos or ZIP revisions.",
      "Sections support bulk selection, duplicate exclusion and independent grid/list ordering that persists after save/reload.",
      "Removing section selections preserves originals; shared photos retain independent order in each section.",
      "Thumbnail browsing and lightbox previews work inside the Payload drawer with immutable-asset editing disabled.",
      "Complete focused tests, typecheck, applicable Biome and local browser workflow checks; retain real-storage release tests in CG-03/09/11."
    ],
    "notes": [
      "Implementation and QA are active in the chat “Improve client gallery photo picking”. The latest browser check found lightbox stacking behind the Payload drawer and Quick edit appearing despite editing being disabled; compatibility fixes are in progress."
    ],
    "evidence": [
      "Active chat reports focused tests/typecheck passing, gallery-filtered grid browsing, bulk append selection, independent reorder save/reload and unchanged ZIP revisions for unused library photos.",
      "Simulated partial upload success/retry refreshed the count without altering selected section photos. This does not verify live R2 transfer."
    ],
    "updatedAt": "2026-10-22"
  },
  {
    "id": "CG-16",
    "title": "Unify the native Featured image upload field",
    "description": "Connect private photo transfers to one native Payload field with Create New, Choose from existing and drag-and-drop actions, as requested after the Overview review.",
    "dependencies": [
      "CG-14"
    ],
    "status": "To do",
    "acceptance": [
      "Use one unified featured-image field for upload, existing-photo selection and drag-and-drop.",
      "Preserve progress, retry/cancel, gallery ownership and original photo bytes.",
      "Verify replacement, focal-point behaviour and saved/unsaved form state through the unified field."
    ],
    "notes": [
      "The completed chat “Simplify client gallery cover tab” acknowledged that composing native UI pieces alongside a separate uploader did not fulfill the requested single field. No completed implementation or acceptance evidence is recorded for this correction."
    ],
    "evidence": [],
    "updatedAt": "2026-10-22"
  }
]
```
