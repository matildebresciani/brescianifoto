import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ResultAsync } from 'neverthrow';
import { getPayload, type SanitizedConfig } from 'payload';
import { normalizeDetails } from '@/lib/client-deliveries/details';

/** Back up and convert raw documents so historical versions retain their IDs and timestamps. */
export const script = async (config: SanitizedConfig) => {
    const isApply = process.argv.includes('--apply');
    const backupPath = process.argv.find((arg) => arg.startsWith('--backup='))?.slice('--backup='.length);
    if (isApply && (!backupPath || !path.isAbsolute(backupPath))) {
        console.error('Apply requires --backup=/absolute/path/to/new-backup.json. No records changed.');
        process.exit(1);
    }
    const result = await ResultAsync.fromPromise(
        (async () => {
            const payload = await getPayload({ config });
            const galleries = payload.db.collections['client-galleries'];
            const versions = payload.db.versions['client-galleries'];
            if (!galleries || !versions) {
                console.error('Client gallery collections are unavailable. No records changed.');
                process.exit(1);
            }
            const targets = [
                { collection: galleries.collection, field: 'details' },
                { collection: versions.collection, field: 'version.details' },
            ];
            const backups = await Promise.all(
                targets.map(async ({ collection, field }) => ({
                    collection: collection.collectionName,
                    field,
                    documents: await collection.find({ [field]: { $type: 'string' } }).toArray(),
                })),
            );
            for (const backup of backups)
                console.log(`${backup.collection}: ${backup.documents.length} plain-text records`);
            if (!isApply) {
                console.log('Dry run only. Apply with --apply --backup=/absolute/path/to/new-backup.json');
                return;
            }
            if (!backupPath) return;
            const serialized = JSON.stringify({
                createdAt: new Date(),
                backups,
            });
            await writeFile(backupPath, serialized, { flag: 'wx', mode: 0o600 });
            let changed = 0;
            let skipped = 0;
            for (const [index, { collection, field }] of targets.entries()) {
                const backup = backups[index];
                if (!backup) continue;
                for (const document of backup.documents) {
                    const value: unknown = field === 'details' ? document.details : document.version?.details;
                    if (typeof value !== 'string') continue;
                    const update = await collection.updateOne(
                        { _id: document._id, [field]: value },
                        { $set: { [field]: normalizeDetails(value) } },
                    );
                    changed += update.modifiedCount;
                    if (!update.matchedCount) skipped += 1;
                }
            }
            console.log(
                `Converted ${changed} records; skipped ${skipped} concurrently changed records. Backup: ${backupPath}`,
            );
        })(),
        (error) => error,
    );
    if (result.isErr()) {
        console.error('Migration stopped. Keep the backup and rerun the dry run before retrying.', result.error);
        // Payload's bin runner exits zero after returning, so exit explicitly on failure.
        process.exit(1);
    }
};
