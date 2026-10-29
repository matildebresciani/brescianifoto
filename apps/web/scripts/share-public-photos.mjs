import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const PUBLIC_COLLECTIONS = ['galleries', '_galleries_versions', 'media', 'icons', 'pages', '_pages_versions'];

const isLocalized = (value) =>
    value && typeof value === 'object' && !Array.isArray(value) && ('da' in value || 'en' in value);
const key = (value) => (value?.toHexString ? value.toHexString() : String(value?._id ?? value?.id ?? value));
/** Danish order wins; English-only photos are retained. */
export function mergePhotos(value) {
    if (!isLocalized(value)) return value;
    const result = [];
    const seen = new Set();
    for (const photo of [...(value.da ?? []), ...(value.en ?? [])]) {
        if (!seen.has(key(photo))) {
            result.push(photo);
            seen.add(key(photo));
        }
    }
    return result;
}
export function sharedAlt(value) {
    if (!isLocalized(value)) return value;
    return value.da?.trim() ? value.da : (value.en ?? value.da ?? '');
}

/** Builds a read-only migration plan against raw MongoDB records. Client collections are never queried. */
export async function planPublicPhotoMigration(db, { EJSON, ObjectId }) {
    const changes = [];
    const selections = [];
    const unmatched = [];
    const visibility = [];
    const recoveredGalleries = [];
    // This allowlist deliberately excludes every client collection and version collection.
    for (const name of PUBLIC_COLLECTIONS) {
        for (const original of await db.collection(name).find({}).toArray()) {
            const updated = EJSON.parse(EJSON.stringify(original));
            const data = name.startsWith('_') ? updated.version : updated;
            if (!data) continue;
            if (name.includes('galleries')) {
                if (
                    name === 'galleries' &&
                    isLocalized(data.gallery) &&
                    !data.gallery.da?.length &&
                    data.gallery.en?.length
                )
                    recoveredGalleries.push({ id: key(original._id), photos: data.gallery.en.length });
                data.gallery = mergePhotos(data.gallery);
                if (isLocalized(data.publishStatus) && data.publishStatus.da !== data.publishStatus.en)
                    visibility.push({ collection: name, id: key(original._id), publishStatus: data.publishStatus });
            } else if (name === 'media' || name === 'icons') {
                data.alt = sharedAlt(data.alt);
            } else {
                const layouts = isLocalized(data.layout) ? data.layout : { da: data.layout };
                const groups = new Map();
                for (const locale of ['da', 'en']) {
                    for (const [index, block] of (layouts?.[locale] ?? []).entries()) {
                        if (block.blockType !== 'gallery' || block.photoSelection) continue;
                        const stableId = block._id ?? block.id;
                        const id = stableId ? key(stableId) : `${locale}-${index}`;
                        const group = groups.get(id) ?? [];
                        group.push({ locale, block });
                        groups.set(id, group);
                    }
                }
                for (const [id, group] of groups) {
                    if (group.length === 1) unmatched.push({ page: key(original._id), block: id });
                    const photos = mergePhotos({
                        da: group
                            .filter((item) => item.locale === 'da')
                            .flatMap(({ block }) => mergePhotos(block.gallery) ?? []),
                        en: group
                            .filter((item) => item.locale === 'en')
                            .flatMap(({ block }) => mergePhotos(block.gallery) ?? []),
                    });
                    const selectionId = new ObjectId(
                        createHash('sha256')
                            .update(`${name}:${key(original._id)}:${id}`)
                            .digest('hex')
                            .slice(0, 24),
                    );
                    const first = group[0].block;
                    const selection = {
                        _id: selectionId,
                        name: `${data.name ?? 'Page'} / ${id}`,
                        selectionMode: first.selectionMode ?? 'custom',
                        gallery: photos,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    };
                    selections.push(selection);
                    for (const { block } of group) {
                        block.photoSelection = selectionId;
                        delete block.gallery;
                        delete block.selectionMode;
                    }
                }
            }
            if (EJSON.stringify(original) !== EJSON.stringify(updated))
                changes.push({ collection: name, original, updated });
        }
    }
    return { changes, selections, unmatched, visibility, recoveredGalleries };
}

async function main() {
    const require = createRequire(import.meta.url);
    const adapterRequire = createRequire(require.resolve('@payloadcms/db-mongodb'));
    const mongoose = adapterRequire('mongoose');
    const { EJSON } = mongoose.mongo.BSON;
    const { ObjectId } = mongoose.mongo;
    const isApply = process.argv.includes('--apply');
    const backupPath = process.argv.find((arg) => arg.startsWith('--backup='))?.slice(9);
    if (isApply && !backupPath) throw new Error('--apply requires --backup=/absolute/path.json');
    await mongoose.connect(process.env.DATABASE_URI);
    try {
        const db = mongoose.connection.db;
        const restorePath = process.argv.find((arg) => arg.startsWith('--restore='))?.slice(10);
        if (restorePath) {
            const backup = EJSON.parse(await readFile(restorePath, 'utf8'));
            if (backup.changes.some((change) => !PUBLIC_COLLECTIONS.includes(change.collection)))
                throw new Error('Backup contains a non-public collection.');
            for (const change of backup.changes)
                await db.collection(change.collection).replaceOne({ _id: change.original._id }, change.original);
            for (const selection of backup.selections)
                await db.collection('photo-selections').deleteOne({ _id: selection._id });
            console.log('Restored. Restart the previous release with a fresh cache.');
            return;
        }
        const { changes, selections, unmatched, visibility, recoveredGalleries } = await planPublicPhotoMigration(db, {
            EJSON,
            ObjectId,
        });
        console.log(
            JSON.stringify(
                {
                    mode: isApply ? 'apply' : 'dry-run',
                    changedDocuments: changes.length,
                    newSelections: selections.length,
                    unmatched,
                    visibility,
                    recoveredGalleries,
                },
                null,
                2,
            ),
        );
        if (!isApply) return;
        for (const selection of selections) {
            if (await db.collection('photo-selections').findOne({ _id: selection._id }))
                throw new Error('Selection ID already exists; restore the backup before retrying a partial migration.');
        }
        // Exclusive creation prevents overwriting the only recovery copy on a rerun.
        await writeFile(backupPath, EJSON.stringify({ changes, selections }, null, 2), { flag: 'wx', mode: 0o600 });
        for (const selection of selections)
            await db
                .collection('photo-selections')
                .updateOne({ _id: selection._id }, { $setOnInsert: selection }, { upsert: true });
        for (const change of changes)
            await db.collection(change.collection).replaceOne({ _id: change.original._id }, change.updated);
        console.log('Applied. Restart the app with a fresh Next cache before serving traffic.');
    } finally {
        await mongoose.disconnect();
    }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main().catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
}
