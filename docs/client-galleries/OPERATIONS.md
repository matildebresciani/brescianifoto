# Client gallery operations

## Photographer workflow

1. Open **Client delivery → Client galleries** in Payload. Create an internal name and public title, then **Save draft**.
2. In **Photo library**, use **Upload photos to library** to upload the whole shoot before creating sections. The uploaded-photo count includes every completed photo belonging to this gallery, including existing section and featured-image uploads. **Browse all photos** opens the Media gallery plugin with grid/list views, filename search, pagination and lightbox previews. Uploading here does not add photos to the delivered page. Up to three files upload at once per panel. Stay on this tab until uploads finish. Retry failed files to retain completed parts; Start again creates a fresh upload. Originals may be up to 50 MiB each; a gallery may select up to 500 distinct photos across its sections.
3. In **Overview**, choose one **Featured image** for the page header and social link previews. Use **Upload featured image** (one JPEG), drag a file onto Payload’s dropzone, or remove the selection and **Choose from existing**. **Adjust focal point** opens Payload’s visual editor; Apply Changes updates the gallery form, and Save draft/Publish persists it. Cancelling leaves the saved framing unchanged. Selecting another image resets framing to center. Subtitle, date, location and rich-text **Details** appear in the header when filled. Expand **Appearance** for layout and alignment; existing settings are retained, with centered text above the image as the default.
4. Add **Text** blocks and **Photo section** blocks under Page sections. Each photo section has a Section introduction Lexical editor for formatted text above its photographs. Text and photo blocks both have Section colors: choose palette variables, semantic gallery tokens, **Gallery default**, or **Custom color**. New sections inherit the gallery background and text; select each independently. Older automatic text selections remain compatible. Dropdowns show a live swatch and hex code. Palette references follow changes in the Colors tab. Older sections without a saved selection retain their existing custom color or inheritance. The section colors also apply to its lightbox; publishing checks their contrast. Use **Choose from existing** to bulk-select photos from this gallery in the Media grid browser. New selections append to the section; already selected photos are excluded from its picker. Use the shared **Grid / List** controls and drag handles to arrange each section independently; keyboard sorting is also supported. **Upload photos to this section** remains a shortcut that adds completed files to both the library and that section. The same photo can appear in multiple sections. Removing a selection does not delete its original file or change another section.
5. Under **Colors → Palette colors**, define each color once using its hex value. Click its hex input for the visual picker or type a six-digit hex value. Assign those colors to the background, foreground and border token dropdowns below; the same color can be reused anywhere. Contrast warnings check base/faded text on base/subtle backgrounds, inverse controls, and each selected section combination. Publishing requires at least 4.5:1 contrast. Fonts and fluid sizing remain shared with the portfolio.
6. Save your final photo selections. Create a ZIP locally containing those original JPEGs, including their metadata. Upload it using **Full gallery ZIP** (up to 25 GiB), then save to attach it. There is no automatic ZIP generation or inspection of the archive's contents.
7. Use Payload’s built-in preview controls to preview the saved draft. Check mobile layout, section navigation and downloads. **Publish** and then **Copy client link**. Open the link in a signed-out browser before sending it yourself.

Publishing requires a **Featured image** and at least one photo selected in a **Photo section**, in addition to the marked name/title fields and readable color contrast. Featured image and Page sections use Payload’s standard red required asterisk. Uploading to the Photo library alone does not satisfy the section requirement. Empty drafts can still be saved; a failed publish points to the missing fields.

The sidebar **Slug** is generated once and forms the final part of the gallery URL. It stays fixed when the title changes, preserving shared links. The stored API field remains `shareId` for compatibility. Use **Copy client link** for the public URL; draft previews use Payload’s native controls.

Changing selected photos marks the archive stale and hides Download all. Upload a replacement ZIP, or check **I confirm this ZIP contains exactly the currently selected photos** and save if the archive is still correct. Confirmation applies only to that photo revision. Rearranging photos does not invalidate the archive.

The links are unlisted, not private authentication. Anyone holding a link may share it. Unpublishing stops the gallery and new download redirects. Signed image URLs are reused within fixed 12-hour UTC windows and expire 24 hours after the window starts, leaving 12–24 hours of source access when a page is rendered. A page left open longer than 12 hours may need refreshing to load more photos. Signed download links retain their 15-minute lifetime; optimized or downloaded copies can remain accessible after expiry. This is unlisted delivery, not immediate-revocation access control.

## Reusable gallery colors

In **Colors → Palette colors**, add a six-digit hex value. Rows and palette options show only a swatch and hex; no color name or internal variable is displayed. Reuse colors in the Background, Text and Border assignments or section selectors. Hex edits update all uses immediately. Internal references stay fixed when the hex or row order changes. Only semantic assignments such as `bg-base` and `fg-base` display variable names. Contrast feedback appears only when something needs attention.

The semantic tokens remain `bg-base`, `bg-subtle`, `bg-invert`, `fg-base`, `fg-faded`, `fg-on-color` and `border-base`. Leave `bg-invert` / `fg-on-color` on **Follow fg-base** / **Follow bg-base** when desired. Filled controls use these values. Default galleries retain the existing neutral palette. Existing palettes are adapted on read and persisted on the next save, with duplicate hex values combined and their appearance preserved. Older automatic text pair selections keep working.

Before deleting a color, change any token or section using it; saving identifies remaining references. For the orange/green inspiration, add these four colors once to the individual gallery:

| Palette color | Hex |
| --- | --- |
| Soft pistachio | `#E9E9C7` |
| Retro green | `#30673A` |
| Tangerine | `#E3792F` |
| Dark neutral | `#151611` |

Select `#E9E9C7` for `bg-base`, `bg-subtle` and `fg-on-color`. Select `#30673A` for `fg-base`, `fg-faded`, `bg-invert` and `border-base`. For orange sections, select `#E3792F` as background and `#151611` as text. For green sections, select `#30673A` as background and `#E9E9C7` as text. No hex values need to be repeated. Pistachio text on tangerine fails the text contrast requirement; the dark neutral passes. No global palette or preset is applied.

## What the collections mean

Client galleries stores each client page and its settings. Client photos stores the original JPEG records; Client downloads stores ZIP archive records. The photo and ZIP collections are hidden from normal CMS navigation because uploads and selection happen inside the gallery editor. They remain separate internally to preserve originals and keep client assets out of the public portfolio.

## Hosting prerequisites

Keep the existing Vercel/Payload/MongoDB deployment. Keep portfolio `R2_*` settings unchanged. Add dedicated client settings in the intended Vercel environment (and in the ignored local environment file when testing locally):

`CLIENT_R2_BUCKET`, `CLIENT_R2_ENDPOINT`, `CLIENT_R2_ACCESS_KEY_ID`, `CLIENT_R2_SECRET_ACCESS_KEY`.

Use `brescianifoto-client-galleries` as `CLIENT_R2_BUCKET`. Create an R2 S3 API token with **Object Read & Write** scoped only to that bucket; save its Access Key ID and Secret Access Key in the corresponding client variables. Use the bucket's S3 API endpoint, without a bucket path, as `CLIENT_R2_ENDPOINT` (including `.eu.` for an EU jurisdiction bucket).

Keep the domain registration, DNS and nameservers at Simply. No client image subdomain or Cloudflare zone is needed. Leave the client bucket's **Public Development URL** disabled and do not connect a custom domain. Client images and admin thumbnails use temporary signed S3 GET URLs; original and ZIP downloads already use signed URLs. `CLIENT_R2_PUBLIC_URL` is no longer used and should be removed if it was added. Never put credentials in NEXT_PUBLIC variables. The scoped object prefix remains `client-deliveries/`. There is no fallback to portfolio storage when client settings are missing.

Deploy the code change together with the four client environment variables; redeploy after setting them so Next image optimization allows the S3 endpoint and client bucket prefix. Existing client asset records contain object keys rather than bucket names: if client files were already uploaded to the portfolio bucket, copy them to the dedicated bucket with the exact same keys before switching. Include `.thumb.webp` objects. Do not delete originals until migrated galleries and downloads have been verified.

### Gallery folders in R2

New uploads use the saved gallery ID as a stable folder prefix:

```text
client-deliveries/<gallery-id>/
  photos/<unique-file-id>.jpg
  thumbnails/<unique-file-id>.webp
  downloads/<unique-file-id>.zip
```

These folders appear automatically as files are uploaded; there is no separate folder-creation step. Renaming a gallery does not move its files. Duplicate filenames get unique storage keys, while downloads retain the original filenames. Existing objects keep their recorded paths, and multipart uploads started under the previous layout can still complete. No migration or deletion of existing files is performed.

### CORS

Apply these rules to the dedicated client bucket. The live admin runs at `https://www.brescianifoto.dk/admin`; include the exact `https://www.brescianifoto.dk` origin as well as the bare domain (no `/admin` path). Add other exact origins only if they actually host the admin, such as a preview deployment. Add localhost only to a development bucket if needed.

```json
[
  {
    "AllowedOrigins": ["https://brescianifoto.dk", "https://www.brescianifoto.dk"],
    "AllowedMethods": ["GET", "HEAD", "PUT"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

The browser uploads 16 MiB parts directly to R2; Vercel receives only small JSON commands. Exposing `ETag` is required to complete multipart uploads. Photo completion has a 60-second route duration and reads one JPEG at a time to verify its format, compute SHA-256, and create a separate 300px WebP thumbnail. The source object is never recompressed or overwritten. Allow sufficient Vercel function memory for three concurrent JPEG validations; test the maximum supported image size on the chosen plan.

Client storage settings must also be available during builds through `turbo.json`: the bucket and endpoint determine Next's allowed image sources, while credentials use environment passthrough. Missing build settings can cause `INVALID_IMAGE_OPTIMIZE_REQUEST` even when uploads succeed at runtime. Keep Payload upload `cacheTags` disabled for client photos so native thumbnails retain their exact signed query strings.

### Abandoned multipart uploads

Add an R2 lifecycle rule **only for prefix `client-deliveries/`** to abort incomplete multipart uploads after one day. Preserve existing lifecycle rules. Cancel attempts an immediate abort; the lifecycle handles closed tabs and lost connections. Completed but unreferenced uploads are retained deliberately, since the photographer may select them later. No automatic deletion of client originals is configured.

### Search indexing and delivery

No Cloudflare domain or response-header rule is required. The application adds noindex metadata/headers to delivery pages, download redirects and optimized client-image responses. Leave delivery page paths crawlable so compliant crawlers can read the noindex directive. Do not add client collections to sitemap or search plugins. Raw S3 image links are temporary bearer links; the S3 endpoint does not supply our application noindex header. Keep public bucket access disabled.

Individual and ZIP downloads redirect to short-lived R2 S3 URLs with attachment filenames, allowing native browser streaming/resume without loading the archive into JavaScript or a Vercel function. The gallery itself stays on the photographer's domain; the storage transfer uses R2's API hostname. Do not proxy large downloads through Vercel to disguise that hostname.

## Verification before first delivery

- Use a dedicated staging gallery and representative JPEGs with EXIF/IPTC/XMP and ICC data. Download the original and compare SHA-256 with the source, then inspect the metadata. An optimized WebP is a viewing preview and is not the metadata-preserving deliverable.
- Upload a multi-gigabyte ZIP; interrupt a part, retry, cancel, and replace the archive. Confirm byte-identical archive download and the expected filename. Inspect CORS response headers.
- Make photo-selection changes after attaching the ZIP. Confirm Download all disappears until replacement or explicit confirmation.
- Verify published links in a signed-out browser, drafts and unpublishing, cross-gallery asset denial, and noindex headers on gallery pages and optimized images. Verify unsigned S3 object requests fail and signed original requests work.
- Test 500 photos with throttled networking. Initial viewing must fetch only the cover and near-viewport optimized previews. No original/ZIP network download should occur until requested.
- Test on an actual phone, including pinch zoom, touch swipes, menu anchors, and downloads through the phone's file interface.
- Verify existing public portfolio pages, galleries, image mixes and admin navigation still work.

The first wedding's real photos, cover choice, text and ZIP have not been supplied. Do not treat QA fixtures as client content or send their links to a client.

## Local QA and build checks

Use a separate local MongoDB database and a second Next build directory to avoid changing the photographer's working content. `NEXT_BUILD_DIR=.next-delivery-qa` allows another dev server on port 3001. QA assets under `public/images/client-delivery-qa/` are ignored by Git and must never be deployed as client content.

From `apps/web`, run `pnpm exec tsx --tsconfig tsconfig.json ../../scripts/check-client-gallery.mts` with local MongoDB running. This repeatable integration check forces the dedicated loopback database `brescianifoto_client_delivery_qa`, creates a QA user and placeholder gallery, tests publication/ownership/contrast/archive revisions, and prints its local preview URL. Temporary QA login details are stored with owner-only permissions in `client-gallery-qa.json` in the operating system's temporary directory; they are never printed or committed. Start its preview with `DATABASE_URI=mongodb://127.0.0.1:27017/brescianifoto_client_delivery_qa R2_PUBLIC_URL=http://localhost:3001 NEXT_PUBLIC_SERVER_URL=http://localhost:3001 NEXT_BUILD_DIR=.next-delivery-qa pnpm dev --port 3001`. Use an environment without `R2_BUCKET` or `CLIENT_R2_BUCKET` for this local fixture. The fixture uses placeholder images, not real wedding photographs.

From `apps/web`: `pnpm test:unit --run`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, and `pnpm build`. If Turbopack stalls in the sandbox, `pnpm build --webpack` checks the same application with Webpack. A build with placeholder R2 settings proves compilation only, not a working storage deployment.

For reusable-color integration checks, run `pnpm exec tsx --tsconfig tsconfig.json ../../scripts/check-client-gallery-colors.mts` from `apps/web`. It uses the separate `brescianifoto_client_colors_qa` database and creates only local placeholder content. QA credentials are stored with owner-only permissions in `client-gallery-colors-qa.json` in the operating system temporary directory. Preview with `DATABASE_URI=mongodb://127.0.0.1:27017/brescianifoto_client_colors_qa CLIENT_R2_BUCKET= R2_BUCKET= NEXT_PUBLIC_SERVER_URL=http://localhost:3002 NEXT_BUILD_DIR=.next-colors-qa pnpm dev --port 3002`.

## Rollout and recovery

The three collections are additive; existing portfolio documents do not need migration. Deploy only after the production storage checks above. Keep galleries as drafts until verified. To stop a problematic delivery, unpublish it in Payload; delivery routes query current publication state on every request. No client-facing changes require editing public navigation. Preserve R2 originals and MongoDB backups during any rollback.

## Editor implementation and compatibility

The editor uses native Payload blocks, tabs, Lexical, drafts, upload fields, thumbnail selection and sorting. Gallery color selectors adapt Payload ReactSelect with live swatches; they store text references because each gallery has a reusable palette with stable variables. The Innovixx color-picker plugin replaces the earlier custom color field. `patches/@innovixx__payload-color-picker-field@2.0.4.patch` records the Next/Payload compatibility adjustments; preserve it when reinstalling dependencies and reassess it when upgrading the plugin. Next transpiles the plugin's JSX source.

ClientPhotos exposes external objects through Payload's upload UI but does not accept ordinary create/update/delete uploads. The verified multipart completion endpoint remains the only writer. Payload’s native Dropzone, buttons, upload picker and thumbnail UI wrap the verified transfer workflow: it keeps progress/retry/cancel, bounded concurrency, original-byte checks, unpredictable keys and gallery ownership. Existing photo IDs, object keys and section selections do not migrate. The read adapter supplies native filename, file size and thumbnail fields from existing records, plus the runtime `sizes.thumbnail.url` shape consumed by the Media gallery plugin. Grid browsing uses thumbnail URLs; lightbox previews retain the original URL. The library queries `client-photos.gallery` directly, so no separate membership array or migration is needed. The plugin is enabled separately for client photos with quick editing disabled. Original crop/replace controls stay disabled. Featured-image framing reuses Payload’s EditUpload component with cropping disabled and stores only gallery focal coordinates.


## Details migration and social preview rollout

The stored featured-image relationship remains `cover`; this is a label/UI change, with no photo migration. `details` now stores Lexical content. Read/write normalization also accepts legacy text so older drafts and restored versions remain readable during rollout.

From `apps/web`, with the intended database environment configured:

1. Run `pnpm payload client-gallery-details` for a dry-run count of plain-text gallery documents and versions.
2. Pause gallery editing for the conversion window. Run `pnpm payload client-gallery-details --apply --backup=/absolute/private/path/client-gallery-details-backup.json`. The file must not already exist. The command writes full affected documents to a mode-0600 JSON backup before changing only their Details fields; IDs, timestamps, status, links, photos, and revisions remain untouched. Store this backup outside the repository and retain your normal MongoDB snapshot for full database recovery.
3. Run the dry run again; both counts should be zero. Any concurrently changed records are skipped and reported, so repeat after reviewing them. The conversion is idempotent. Verify a saved draft and a restored version in Overview before reopening editing.
4. For rollback of this field change, restore only `details` / `version.details` from the backup using each record’s original `_id`, converting string IDs to their database ID type. Do not replace whole documents or overwrite newer edits. The JSON backup records dates/IDs as strings; use the MongoDB snapshot for a full-fidelity database rollback.

`/deliveries/[shareId]/social-image` creates a separate 1200×630 JPEG from the currently published featured image, using the gallery focal point and preserving color. It never writes storage objects. Metadata uses the public title, optional subtitle, and an absolute revision-qualified URL for both Open Graph and Twitter. Draft previews omit social metadata. Requests with `preview`, unpublished/missing galleries, or unowned/missing featured images return 404. Responses are no-store and noindex; social services may still retain previews they already fetched. Production must set the correct public site URL and have working client storage.

For repeatable migration verification, run `pnpm exec tsx --tsconfig tsconfig.json ../../scripts/check-client-gallery-overview.mts`. It forces the isolated `brescianifoto_client_delivery_qa` database and checks dry run, backup, current/version conversion, idempotence, version restore, and focal metadata without accessing real client storage.


### Media gallery plugin compatibility

Preserve `patches/@sitebytom__payload-media-gallery@1.2.0.patch` when reinstalling dependencies. It places plugin lightboxes above Payload list drawers, respects disabled editing for client photos, and closes a lightbox before opening Quick edit for editable collections. Recheck these behaviours before upgrading the plugin.
