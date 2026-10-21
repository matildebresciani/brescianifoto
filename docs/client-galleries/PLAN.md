# Client gallery delivery

## How to resume

Read this file before starting a gallery task. Update task status, notes and verification evidence in the `client-gallery-tasks` JSON block below, then run `node scripts/render-client-gallery-plan.mjs` from the repository root. Open `dashboard.html` locally. It is generated and must not be edited independently. Mark tasks Done only when every acceptance criterion is verified. Record environmental blockers honestly.

## Accepted specification

Build an unlisted, editorial wedding gallery experience at `/deliveries/<unique-link>`, managed in Payload, hosted on Vercel and Cloudflare R2. Support up to 500 edited JPEGs, custom colors with the existing Instrument Serif/Archivo/IBM Plex Mono fonts, independent rich-text and photo-section blocks, original individual downloads and a manually uploaded ZIP. No passwords or accounts for recipients. Saved file URLs can remain accessible after unpublishing.

### Independent client area

Separate `client-galleries`, `client-photos`, and `client-downloads` collections from public portfolio galleries and media. Admin-only collection APIs; public pages explicitly project only visitor fields. Stable unpredictable share IDs. Draft/unpublished and invalid links return generic 404s; authenticated preview is available. Independent delivery layout, outside portfolio navigation and locale routing. Exclude all client content from navigation, archives, automatic mixes, public collection listings and sitemaps. Emit noindex on pages and file responses where served; allow crawlers to read page noindex. Link access is unlisted, not authenticated privacy.

### Authoring

Internal name, public title, cover, subtitle, optional date/location/details, theme, ordered blocks, download settings and share link. Cover layouts: text above image (default) or full-width image with text over it; left/center/right alignment, focal point and neutral overlay. Rich text: paragraphs, H2–H4, bold/italic/underline, links, ordered/unordered lists and alignment. Shared fluid typography, no arbitrary inline font sizes. Photo blocks: required title, optional menu label, immutable anchor, ordered photos. Bulk upload/select/reorder and move photos between sections. Omit empty sections from visitor page/menu.

Each photo section also has an optional Lexical introduction above its photographs. Both text and photo blocks choose background/text colors from the gallery palette, inherit the corresponding gallery role, or use a custom hex color with a visual picker. Palette references follow later gallery color changes; existing hex overrides remain compatible. Section palettes apply to supporting text and the photo viewer, with publishing contrast validation. The Lexical editor includes standard text formatting, H2–H4, alignment, indentation, ordered/unordered/check lists, quotes, links and dividers; client images remain managed through photo sections.

### Presentation

Default bone/void palette, customizable background/surface/text/muted/border roles via validated CSS variables. Buttons derive from the palette. Scoped theme includes portal lightboxes. Show contrast feedback and prevent unreadable published combinations. Preserve original photo colors/proportions. Uncropped masonry-style two-column mobile/three-column desktop grid; cover alone may crop. Sticky desktop menu with active section, expandable mobile menu showing current section, anchor deep links, keyboard navigation, sticky offset and reduced motion. Minimal branding/footer, no portfolio navigation.

### Uploads and downloads

Unpredictable isolated R2 object keys; original names retained for attachment downloads. Original JPEG bytes never resized/recompressed/rewritten; generate admin thumbnail separately. Responsive Next image optimization with WebP, dimensions and lazy loading; prioritize cover; load lightbox previews on demand. Bulk upload bounded concurrency, progress, per-file errors and idempotent retries. Direct R2 multipart ZIP upload with retry/cancel/completion verification and abandoned-upload cleanup. Original/ZIP downloads go straight to storage with attachment headers, never buffered in browser JS or Vercel. Preserve existing EXIF/IPTC/XMP/color profiles. Show ZIP size; bind ZIP to a photo-set revision. Photo add/replace/remove makes ZIP stale and hides Download all until replacement or explicit photographer confirmation. Reordering alone does not invalidate the archive.

### Release criteria

Verify isolation, editor persistence/order/anchors, 320/375/768/1440px layouts, long titles, both cover layouts, mixed photo proportions, custom palettes, keyboard/focus/zoom/contrast/reduced motion. Test 500-photo behavior, offscreen lazy loading, no original/ZIP downloads during browsing. Compare original hashes and metadata. Test upload failures/retry/cancel/duplicate names and multi-gigabyte ZIPs. Run relevant tests, typecheck, lint, format and build. Configure production CORS/lifecycle/noindex headers, deploy and check the supplied first gallery on production and an actual phone. Photographer supplies photos, text, cover and ZIP; client messaging is manual.

### Deferred

Automatic ZIP creation, selectable fonts, passwords, favorites/proofing, print sales, client accounts and RAW/TIFF delivery.

## Decisions and implementation notes

- 2026-10-21: Scope accepted by photographer. Vercel + R2 confirmed.
- Use dedicated client asset records and signed direct R2 uploads so Payload image processing cannot rewrite original files. The public portfolio media pipeline remains unchanged.
- Object metadata alone cannot set X-Robots-Tag on a public R2 custom domain; configure that response header for the client prefix in Cloudflare.
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
      "Implementation complete. Live R2 transfer and maximum-size photo verification await R2 environment configuration.",
      "JPEG upload controls now live inside each Photo section and automatically append successful files. Gallery-library and ZIP uploads share the same progress/retry panel. Live R2 verification is still required."
    ],
    "evidence": [
      "Unit tests cover preserved source bytes and EXIF/XMP/ICC, SHA-256, separate thumbnails, multipart completion/idempotency/cancel and size limits."
    ],
    "updatedAt": "2026-10-21"
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
      "Added native visual color pickers beside each hex field; no extra plugin dependency.",
      "Added optional photo-section Lexical introductions and per-block background/text overrides with inherit/reset controls. Expanded both editors to the standard Lexical text-formatting features.",
      "Simplified the workflow to Client galleries: underlying photo/ZIP collections are hidden from the sidebar. Added direct section uploads and an optional cover/library uploader.",
      "DIF follow-up implemented: plugin color picker, palette-role section colors, native Payload cover/photo selection and sorting; removed custom PhotoPicker. Existing records/hex overrides stay compatible. Resumable transfer panel retained."
    ],
    "evidence": [
      "Browser: palette edits saved; photo order persisted; text alignment controls present; centered rich text rendered correctly.",
      "Browser verified both directions of hex/swatch synchronization, immediate contrast feedback, and saved values after reload. Typecheck and lint passed.",
      "Real Payload save/read preserved nested rich text and colors; publication rejected low-contrast section colors. Browser verified bold editing, saving, preview, palette reset and color feedback.",
      "Browser confirmed inline section upload controls and gallery-only client navigation. Three merge tests verify current-order preservation, retry deduplication, and empty/populated sections. Actual file transfer remains pending R2 setup.",
      "34 focused tests pass; native metadata/palette compatibility exercised with real local Payload. Browser confirmed thumbnail bulk picker, palette roles and plugin swatch changes; typecheck, lint and production Webpack build passed."
    ],
    "updatedAt": "2026-10-21"
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
      "Editorial and overlay covers implemented, with focal points and responsive long-title wrapping."
    ],
    "evidence": [
      "Both layouts checked in browser; long-title overlay fits at 375px; neutral overlay text contrast repaired during QA."
    ],
    "updatedAt": "2026-10-21"
  },
  {
    "id": "CG-07",
    "title": "Sections and navigation",
    "description": "Uncropped two/three-column grid; lazy WebP previews. Stable anchors; sticky desktop menu and expandable active mobile section menu.",
    "dependencies": [
      "CG-03",
      "CG-04",
      "CG-05"
    ],
    "status": "Done",
    "acceptance": [
      "Uncropped two/three-column grid; lazy WebP previews.",
      "Stable anchors; sticky desktop menu and expandable active mobile section menu."
    ],
    "notes": [
      "Two/three-column uncropped photo sections, stable menu anchors, active section and expandable mobile menu.",
      "Section introductions render above the photos. Colors are scoped to their block and lightbox; adjacent sections inherit the gallery normally."
    ],
    "evidence": [
      "500-photo browser fixture: 501 images including cover, 500 lazy images, 15 initially loaded, zero original images loaded directly; mobile anchor navigation passed.",
      "Browser checked dark section/light text, centered bold introduction, unaffected neighbor, lightbox palette, and 375px two-column layout without horizontal overflow."
    ],
    "updatedAt": "2026-10-21"
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
      "Implementation complete. Live multipart ZIP transfer, interrupted native downloads and multi-gigabyte integrity checks await R2 configuration."
    ],
    "evidence": [
      "Tests cover multipart archive initiation, signature verification, recorded revision, stale ZIP rejection, download toggles and direct redirects. Real Payload checks verified reorder stability, photo-change invalidation and one-shot confirmation."
    ],
    "updatedAt": "2026-10-21"
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
      "Authenticated saved-draft preview, refresh-on-save, share controls, publish validation and noindex/no-store behavior implemented."
    ],
    "evidence": [
      "HTTP checks passed: existing published snapshot survives a draft edit, anonymous preview denied, admin preview allowed, unpublish returns 404, republish restores gallery, invalid download denied."
    ],
    "updatedAt": "2026-10-21"
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
      "30 client-delivery tests pass. Final typecheck, lint, formatting and production Webpack build pass. Live R2 and actual-phone checks remain; the full suite has one existing metadata-test mismatch. See VALIDATION.md."
    ],
    "evidence": [
      "Full suite: 177 passing / 1 existing metadata-formatting failure. All 27 delivery tests pass. Final typecheck, lint, formatting and Webpack build passed. Browser checks cover 320/375/768/1440px, both covers, theme, lightbox and a 500-photo fixture. Real local Payload/HTTP integration passed.",
      "Section follow-up: all 30 client-delivery tests and 3 shared RichText renderer tests pass; real local integration, typecheck, lint and formatting pass.",
      "Inline-upload follow-up: three additional client upload-selection tests, typecheck and lint passed. Browser inspected controls and simplified sidebar; no live storage transfer was verified.",
      "DIF refactor: 34 focused tests pass, typecheck/lint/build passed, local Payload metadata/palette checks and browser editor checks completed. No live R2 transfer claimed."
    ],
    "updatedAt": "2026-10-21"
  },
  {
    "id": "CG-12",
    "title": "First delivery and handover",
    "description": "Production R2 CORS/lifecycle/header configuration and deployment. First supplied wedding gallery tested on the live domain and a real phone; handover documented.",
    "dependencies": [
      "CG-11"
    ],
    "status": "Blocked",
    "acceptance": [
      "Production R2 CORS/lifecycle/header configuration and deployment.",
      "First supplied wedding gallery tested on the live domain and a real phone; handover documented."
    ],
    "notes": [
      "Needs production Vercel/R2 access/configuration and the actual wedding photos, cover, text and ZIP. No production deployment or client sharing performed."
    ],
    "evidence": [
      "Operations guide documents CORS, lifecycle cleanup, noindex headers, deployment, verification and rollback."
    ],
    "updatedAt": "2026-10-21"
  }
]
```
