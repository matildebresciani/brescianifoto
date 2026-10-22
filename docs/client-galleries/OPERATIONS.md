# Client gallery operations

## Photographer workflow

1. Open **Client delivery → Client galleries** in Payload. Create an internal name and public title, then **Save draft**.
2. Under **Page sections**, add a **Photo section** and use **Upload photos to this section**. Successful files are added to that section automatically, in file-selection order. Existing selections and edits are preserved. Up to three files upload at once per upload panel. Keep the tab open. Retry failed files to retain completed parts; Start again creates a fresh upload. Originals may be up to 50 MiB each; a published gallery may select up to 500 distinct photos.
3. Choose a cover from the uploaded photos and set its layout/alignment/focal point. Use **Upload a cover photo** directly in the Cover tab, or remove the current cover selection and choose another existing gallery photo. The cover is the large image at the top of the delivered page. Optional subtitle, date, venue and short details appear only when filled.
4. Add **Text** blocks and **Photo section** blocks under Page sections. Each photo section has a Section introduction Lexical editor for formatted text above its photographs. Text and photo blocks both have Section colors: choose named gallery palette roles, **Inherit gallery color**, or **Custom color**. Palette references follow changes in the Colors tab. A preview shows the resolved background and text. Leaving a selector empty preserves an older custom color, otherwise it inherits. The section colors also apply to its lightbox; publishing checks their contrast. Use **Choose from existing** to bulk-select photos from this gallery with Payload’s native thumbnail list, then drag selected rows to order them. Payload also supplies keyboard sorting through its drag handles. To move a photo, remove it from one section and select it in another. Removing a selection does not delete its original file.
5. Set colors under Colors. Click a hex input to open the visual color picker and preset swatches, or type a six-digit hex value. Both controls stay in sync. Contrast feedback checks both text roles against both surfaces. Publishing requires at least 4.5:1 contrast. Fonts and fluid sizing remain shared with the portfolio.
6. Save your final photo selections. Create a ZIP locally containing those original JPEGs, including their metadata. Upload it using **Full gallery ZIP** (up to 25 GiB), then save to attach it. There is no automatic ZIP generation or inspection of the archive's contents.
7. Preview the saved draft. Check mobile layout, section navigation and downloads. **Publish** and then **Copy client link**. Open the link in a signed-out browser before sending it yourself.

Changing selected photos marks the archive stale and hides Download all. Upload a replacement ZIP, or check **I confirm this ZIP contains exactly the currently selected photos** and save if the archive is still correct. Confirmation applies only to that photo revision. Rearranging photos does not invalidate the archive.

The links are unlisted, not private authentication. Anyone holding a link may share it. Unpublishing stops the gallery and new download redirects. Already issued signed image URLs last up to 24 hours and signed download links up to 15 minutes; optimized or downloaded copies can remain accessible after expiry. A page left open longer than 24 hours may need refreshing to load more photos. This is unlisted delivery, not immediate-revocation access control.

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

Apply these rules to the dedicated client bucket. The admin runs at `https://brescianifoto.dk/admin`, so its allowed origin is `https://brescianifoto.dk` (no `/admin` path). Add other exact origins only if they actually host the admin, such as a preview deployment. Add localhost only to a development bucket if needed.

```json
[
  {
    "AllowedOrigins": ["https://brescianifoto.dk"],
    "AllowedMethods": ["GET", "HEAD", "PUT"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

The browser uploads 16 MiB parts directly to R2; Vercel receives only small JSON commands. Exposing `ETag` is required to complete multipart uploads. Photo completion has a 60-second route duration and reads one JPEG at a time to verify its format, compute SHA-256, and create a separate 300px WebP thumbnail. The source object is never recompressed or overwritten. Allow sufficient Vercel function memory for three concurrent JPEG validations; test the maximum supported image size on the chosen plan.

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

For token/highlight integration checks, run `pnpm exec tsx --tsconfig tsconfig.json ../../scripts/check-client-gallery-colors.mts` from `apps/web`. It uses the separate `brescianifoto_client_colors_qa` database and creates only local placeholder content. QA credentials are stored with owner-only permissions in `client-gallery-colors-qa.json` in the operating system temporary directory. Preview with `DATABASE_URI=mongodb://127.0.0.1:27017/brescianifoto_client_colors_qa CLIENT_R2_BUCKET= R2_BUCKET= NEXT_PUBLIC_SERVER_URL=http://localhost:3002 NEXT_BUILD_DIR=.next-colors-qa pnpm dev --port 3002`.

## Rollout and recovery

The three collections are additive; existing portfolio documents do not need migration. Deploy only after the production storage checks above. Keep galleries as drafts until verified. To stop a problematic delivery, unpublish it in Payload; delivery routes query current publication state on every request. No client-facing changes require editing public navigation. Preserve R2 originals and MongoDB backups during any rollback.

## Editor implementation and compatibility

The editor uses native Payload blocks, tabs, selects, Lexical, drafts, upload fields, thumbnail selection and sorting. The Innovixx color-picker plugin replaces the earlier custom color field. `patches/@innovixx__payload-color-picker-field@2.0.4.patch` records the Next/Payload compatibility adjustments; preserve it when reinstalling dependencies and reassess it when upgrading the plugin. Next transpiles the plugin's JSX source.

ClientPhotos exposes external objects through Payload's upload UI but does not accept ordinary create/update/delete uploads. The verified multipart completion endpoint remains the only writer. The small inline transfer panel is intentional: it keeps progress/retry/cancel, bounded concurrency, original-byte checks, unpredictable keys and gallery ownership. Existing photo IDs, object keys and section selections do not migrate. The read adapter supplies native filename, file size and thumbnail fields from existing records. Native crop/replace controls are disabled.
