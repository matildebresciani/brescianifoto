import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

import { PUBLIC_COLLECTIONS, planPublicPhotoMigration } from '../src/lib/utilities/public-photo-migration.mjs';

export { mergePhotos, planPublicPhotoMigration, sharedAlt } from '../src/lib/utilities/public-photo-migration.mjs';

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
