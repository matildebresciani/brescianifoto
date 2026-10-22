// Verify native Payload draft persistence only in this dedicated loopback QA database.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { getPayload } from 'payload';

process.chdir(fileURLToPath(new URL('../apps/web', import.meta.url)));
process.loadEnvFile('.env.development');
process.env.NODE_ENV = 'development';
process.env.DATABASE_URI = 'mongodb://127.0.0.1:27017/brescianifoto_client_layout_qa';
delete process.env.CLIENT_R2_BUCKET;
delete process.env.R2_BUCKET;
const { default: config } = await import('../apps/web/src/payload.config.ts');
const { deliveryView } = await import('../apps/web/src/lib/client-deliveries/read.ts');
const payload = await getPayload({ config });
const title = `Gallery layout QA ${randomUUID()}`;
const gallery = await payload.create({
    collection: 'client-galleries',
    data: { name: title, title, _status: 'draft' },
    draft: true,
    overrideAccess: true,
});
assert.equal(gallery.desktopColumns, '4');
assert.equal(gallery.photoSpacing, '2');
for (const columns of ['3', '4'] satisfies ('3' | '4')[]) {
    for (const spacing of ['0', '2', '4', '8'] satisfies ('0' | '2' | '4' | '8')[]) {
        await payload.update({
            collection: 'client-galleries',
            id: gallery.id,
            draft: true,
            data: { desktopColumns: columns, photoSpacing: spacing },
            overrideAccess: true,
        });
        const saved = await payload.findByID({
            collection: 'client-galleries',
            id: gallery.id,
            draft: true,
            overrideAccess: true,
        });
        assert.equal(saved.desktopColumns, columns);
        assert.equal(saved.photoSpacing, spacing);
        assert.equal(saved.shareId, gallery.shareId);
        assert.equal(saved.photoRevision, gallery.photoRevision);
        const view = await deliveryView(
            { gallery: saved, photos: [], archive: undefined, isArchiveCurrent: false },
            true,
        );
        assert.equal(view.desktopColumns, Number(columns));
        assert.equal(view.photoSpacing, Number(spacing));
    }
}
await payload.destroy();
console.log(
    'Gallery layout QA passed: default four columns/2px spacing, save/reload all column/spacing combinations, visitor projection, stable links/revision.',
);
process.exit(0);
