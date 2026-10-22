// Exercises only the isolated loopback QA database, never a configured client database.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPayload } from 'payload';

process.chdir(fileURLToPath(new URL('../apps/web', import.meta.url)));
process.loadEnvFile('.env.development');
process.env.NODE_ENV = 'development';
process.env.DATABASE_URI = 'mongodb://127.0.0.1:27017/brescianifoto_client_delivery_qa';
process.env.NEXT_PUBLIC_SERVER_URL = 'http://localhost:3001';
delete process.env.CLIENT_R2_BUCKET;
delete process.env.R2_BUCKET;
const { default: config } = await import('../apps/web/src/payload.config.ts');
const { script: migrate } = await import('../apps/web/src/scripts/client-gallery-details.ts');
const payload = await getPayload({ config });
const title = `Details migration QA ${randomUUID()}`;
const gallery = await payload.create({
    collection: 'client-galleries',
    data: { name: title, title, _status: 'draft' },
    overrideAccess: true,
});
const collection = payload.db.collections['client-galleries']?.collection;
const versions = payload.db.versions['client-galleries']?.collection;
assert.ok(collection && versions);
const original = await collection.findOne({ name: title });
const version = await versions.findOne({ 'version.name': title });
assert.ok(original && version);
const legacy = 'First line\r\n\r\nKeep MiXeD case';
await collection.updateOne({ _id: original._id }, { $set: { details: legacy } });
await versions.updateOne({ _id: version._id }, { $set: { 'version.details': legacy } });
const oldArgs = process.argv;
process.argv = oldArgs.slice(0, 2);
await migrate(await config);
assert.equal((await collection.findOne({ _id: original._id }))?.details, legacy);
const backup = path.join(tmpdir(), `client-gallery-details-qa-${randomUUID()}.json`);
process.argv = [...oldArgs.slice(0, 2), '--apply', `--backup=${backup}`];
await migrate(await config);
const converted = await collection.findOne({ _id: original._id });
const convertedVersion = await versions.findOne({ _id: version._id });
assert.equal(converted?.details.root.children.length, 3);
assert.deepEqual(converted?.details, convertedVersion?.version.details);
assert.deepEqual(converted?.updatedAt, original.updatedAt);
assert.equal(
    JSON.parse(await readFile(backup, 'utf8')).backups.some((entry) =>
        entry.documents.some((doc) => doc.details === legacy),
    ),
    true,
);
process.argv = oldArgs.slice(0, 2);
await migrate(await config);
assert.deepEqual((await collection.findOne({ _id: original._id }))?.details, converted?.details);
const restored = await payload.restoreVersion({
    collection: 'client-galleries',
    id: String(version._id),
    overrideAccess: true,
});
assert.deepEqual(restored.details, converted?.details);
const saved = await payload.update({
    collection: 'client-galleries',
    id: gallery.id,
    data: { focalX: 0, focalY: 100 },
    overrideAccess: true,
});
assert.equal(saved.focalX, 0);
assert.equal(saved.focalY, 100);
assert.equal(saved.photoRevision, restored.photoRevision);
process.argv = oldArgs;
console.log(
    'Overview migration QA passed: dry run, backup, current/version conversion, repeat run, restore, focal metadata.',
);
await payload.destroy();

process.exit(0);
