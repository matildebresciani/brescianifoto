# Public photo migration

Run from `apps/web`, loading DATABASE_URI for the intended database. The script excludes all client collections through a fixed allowlist.

1. Pause traffic and writes; retain the previous release for rollback.
2. Preview: `node --env-file=.env.development scripts/share-public-photos.mjs`. Use the appropriate environment file for deployment.
3. Review counts, unmatched blocks, and publishing-status differences. Danish photo order is retained and English-only photos appended. Danish alt text wins unless empty. Blocks pair only by stable ID; unmatched blocks get independent selections. Historical page versions get independent selection records so restoration preserves historical photos.
4. Apply: `node --env-file=.env.development scripts/share-public-photos.mjs --apply --backup=/absolute/private/path/photos.json`. An exclusive BSON-preserving backup is written before database changes. Keep it private.
5. Deploy the new schema and generate types/import map. Clear the Next data and full-route caches before resuming traffic; a restart alone may retain persistent caches. Check the recovered public gallery and alt text in both languages, and custom/random page selections.
6. Repeat preview: changed counts should be zero. Publishing differences are reported without changing them.

Rollback while writes are paused: `node --env-file=.env.development scripts/share-public-photos.mjs --restore=/absolute/private/path/photos.json`. Redeploy the previous release with fresh caches. After a partial failure, restore before retrying apply. Restoration overwrites affected documents, so do not restore after accepting new edits.

Raw MongoDB writes preserve media IDs and versions without invoking unrelated hooks; this is why migration and cache clearing must happen during deployment downtime. No uploads are moved or deleted. Captions and all client data remain untouched.

## Run inside Vercel without exporting credentials

The signed-in CMS administrator can open `/api/maintenance/public-photos` for a read-only preview. The apply form is bound to that exact plan and expires after ten minutes; content changes require a fresh preview. Apply writes BSON-preserving backup rows to the private `_public_photo_migration_backups` MongoDB collection before applying the changes in one transaction. No credentials are returned to the browser.

The success page includes the backup run ID and a restore link. `/api/maintenance/public-photos?restore=RUN_ID` shows the authenticated restore form. Restore runs transactionally and refuses to overwrite subsequent edits. Stage the shared-schema deployment before applying, promote it immediately afterward, and verify the same endpoint reports zero remaining changes. Both apply and restore invalidate public cache tags. The maintenance-only release retains the original schema and can be used for rollback.
