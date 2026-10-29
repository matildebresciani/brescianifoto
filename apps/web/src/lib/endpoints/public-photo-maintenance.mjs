import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { revalidateTag } from 'next/cache';
import { PUBLIC_COLLECTIONS, planPublicPhotoMigration } from '../utilities/public-photo-migration.mjs';

const escapeHTML = (value) =>
    String(value).replace(
        /[&<>"']/g,
        (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char],
    );
const sign = (secret, timestamp, fingerprint) =>
    createHmac('sha256', secret).update(`public-photo-migration:${timestamp}:${fingerprint}`).digest('hex');
const html = (body, status = 200) =>
    new Response(
        `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Public photo migration</title><body><h1>Public photo migration</h1>${body}</body></html>`,
        {
            status,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'private, no-store',
                'X-Robots-Tag': 'noindex, nofollow',
                'Content-Security-Policy':
                    "default-src 'none'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
            },
        },
    );

/** Runs with the existing server-side database connection; credentials never leave Vercel. */
export const handlePublicPhotoMaintenance = async (req) => {
    if (!req.user || req.user.collection !== 'users') return html('<p>Sign in to the CMS first.</p>', 401);
    const connection = req.payload.db.connection;
    const db = connection.db;
    const { BSON, ObjectId } = connection.base.mongo;
    const restoreId = new URL(req.url).searchParams.get('restore');
    if (restoreId) {
        if (!/^[a-f0-9]{24}$/.test(restoreId)) return html('<p>Invalid backup ID.</p>', 400);
        const backupId = new ObjectId(restoreId);
        const backups = db.collection('_public_photo_migration_backups');
        const run = await backups.findOne({ _id: backupId, kind: 'run', status: 'applied' });
        if (!run) return html('<p>No applied backup found.</p>', 404);
        const timestamp = String(Date.now());
        const fingerprint = `restore:${restoreId}`;
        if (req.method !== 'POST')
            return html(
                `<p>Restore backup ${escapeHTML(restoreId)}. Restoration refuses to overwrite later edits.</p><form method="post"><input type="hidden" name="timestamp" value="${timestamp}"><input type="hidden" name="signature" value="${sign(req.payload.config.secret, timestamp, fingerprint)}"><button type="submit">Restore public photo backup</button></form>`,
            );
        const form = new URLSearchParams(await req.text());
        const issuedAt = form.get('timestamp') ?? '';
        const signature = form.get('signature') ?? '';
        if (
            !/^\d+$/.test(issuedAt) ||
            Math.abs(Date.now() - Number(issuedAt)) > 600000 ||
            !/^[a-f0-9]{64}$/.test(signature) ||
            !timingSafeEqual(
                Buffer.from(signature, 'hex'),
                Buffer.from(sign(req.payload.config.secret, issuedAt, fingerprint), 'hex'),
            )
        )
            return html('<p>Invalid restore request.</p>', 409);
        const rows = await backups.find({ run: backupId }).toArray();
        const session = await connection.startSession();
        try {
            await session.withTransaction(async () => {
                for (const row of rows) {
                    if (row.kind === 'document') {
                        if (!PUBLIC_COLLECTIONS.includes(row.collection)) throw new Error('Non-public backup entry.');
                        const current = await db
                            .collection(row.collection)
                            .findOne({ _id: row.original._id }, { session });
                        if (BSON.EJSON.stringify(current) !== BSON.EJSON.stringify(row.updated))
                            throw new Error('Later edits detected; restoration cancelled.');
                        await db
                            .collection(row.collection)
                            .replaceOne({ _id: row.original._id }, row.original, { session });
                    } else if (row.kind === 'selection') {
                        const current = await db
                            .collection('photo-selections')
                            .findOne({ _id: row.selection._id }, { session });
                        if (BSON.EJSON.stringify(current) !== BSON.EJSON.stringify(row.selection))
                            throw new Error('Selection was edited; restoration cancelled.');
                        await db.collection('photo-selections').deleteOne({ _id: row.selection._id }, { session });
                    }
                }
                await backups.updateOne({ _id: backupId }, { $set: { status: 'restored' } }, { session });
            });
        } finally {
            await session.endSession();
        }
        for (const tag of ['galleries', 'media', 'pages', 'options']) revalidateTag(tag, { expire: 0 });
        return html('<p>Backup restored. Keep the previous gallery schema live.</p>');
    }
    const plan = await planPublicPhotoMigration(db, { EJSON: BSON.EJSON, ObjectId });
    const fingerprint = createHash('sha256').update(BSON.EJSON.stringify(plan.changes)).digest('hex');
    if (req.method === 'POST') {
        const form = new URLSearchParams(await req.text());
        const timestamp = form.get('timestamp') ?? '';
        const signature = form.get('signature') ?? '';
        if (
            !/^\d+$/.test(timestamp) ||
            Math.abs(Date.now() - Number(timestamp)) > 600000 ||
            !/^[a-f0-9]{64}$/.test(signature) ||
            !timingSafeEqual(
                Buffer.from(signature, 'hex'),
                Buffer.from(sign(req.payload.config.secret, timestamp, fingerprint), 'hex'),
            )
        )
            return html('<p>Preview expired or data changed. Reload to preview again.</p>', 409);
        if (!plan.changes.length) return html('<p>Already migrated. No changes needed.</p>');
        const session = await connection.startSession();
        const backupId = new ObjectId();
        const backups = db.collection('_public_photo_migration_backups');
        // Separate rows avoid MongoDB’s document-size limit and retain native BSON types.
        await backups.insertOne({
            _id: backupId,
            kind: 'run',
            createdAt: new Date(),
            fingerprint,
            user: req.user.id,
            status: 'prepared',
        });
        await backups.insertMany(plan.changes.map((change) => ({ run: backupId, kind: 'document', ...change })));
        if (plan.selections.length)
            await backups.insertMany(
                plan.selections.map((selection) => ({ run: backupId, kind: 'selection', selection })),
            );
        try {
            await session.withTransaction(async () => {
                for (const selection of plan.selections)
                    await db.collection('photo-selections').insertOne(selection, { session });
                for (const change of plan.changes) {
                    const current = await db
                        .collection(change.collection)
                        .findOne({ _id: change.original._id }, { session });
                    if (BSON.EJSON.stringify(current) !== BSON.EJSON.stringify(change.original))
                        throw new Error('Content changed during migration. No changes applied.');
                    await db
                        .collection(change.collection)
                        .replaceOne({ _id: change.original._id }, change.updated, { session });
                }
                await backups.updateOne({ _id: backupId }, { $set: { status: 'applied' } }, { session });
            });
        } finally {
            await session.endSession();
        }
        for (const tag of ['galleries', 'media', 'pages', 'options']) revalidateTag(tag, { expire: 0 });
        return html(
            `<p>Migration applied. Backup run: ${escapeHTML(backupId.toHexString())}</p><p>Deploy the shared-field schema now, then reload this page to verify zero pending changes.</p>`,
        );
    }
    const timestamp = String(Date.now());
    const summary = {
        changedDocuments: plan.changes.length,
        newSelections: plan.selections.length,
        unmatched: plan.unmatched,
        recoveredGalleries: plan.recoveredGalleries,
        visibility: plan.visibility,
        fingerprint,
    };
    return html(
        `<p>Read-only production preview. Client collections are excluded.</p><pre>${escapeHTML(JSON.stringify(summary, null, 2))}</pre><form method="post"><input type="hidden" name="timestamp" value="${timestamp}"><input type="hidden" name="signature" value="${sign(req.payload.config.secret, timestamp, fingerprint)}"><button type="submit">Back up and apply public photo migration</button></form>`,
    );
};

/** @type {import('payload').Endpoint[]} */
export const publicPhotoMaintenance = [
    { path: '/maintenance/public-photos', method: 'get', handler: handlePublicPhotoMaintenance },
    { path: '/maintenance/public-photos', method: 'post', handler: handlePublicPhotoMaintenance },
];
