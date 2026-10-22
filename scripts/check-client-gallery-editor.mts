// Uses only a dedicated loopback QA database and local placeholder images.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPayload } from 'payload';
import { detailsFromText } from '../apps/web/src/lib/client-deliveries/details';

process.chdir(fileURLToPath(new URL('../apps/web', import.meta.url)));
process.loadEnvFile('.env.development');
process.env.NODE_ENV = 'development';
process.env.DATABASE_URI = 'mongodb://127.0.0.1:27017/brescianifoto_client_editor_qa';
process.env.NEXT_PUBLIC_SERVER_URL = 'http://localhost:3003';
process.env.R2_PUBLIC_URL = 'http://localhost:3003';
delete process.env.CLIENT_R2_BUCKET;
delete process.env.R2_BUCKET;
const { default: config } = await import('../apps/web/src/payload.config.ts');
const payload = await getPayload({ config });
const password = randomBytes(24).toString('hex');
const email = `editor-qa-${Date.now()}@example.test`;
await payload.create({
    collection: 'users',
    data: { name: 'Gallery editor QA', email, password },
    overrideAccess: true,
});
const created = await payload.create({
    collection: 'client-galleries',
    data: { name: 'Gallery editor QA — local placeholders', title: 'An evening in photographs', _status: 'draft' },
    overrideAccess: true,
});
await mkdir('public/images/client-delivery-qa', { recursive: true });
const photos = [];
for (let index = 0; index < 26; index++) {
    const storageKey = `images/client-delivery-qa/editor-${created.id}-${index}.jpg`;
    await copyFile('public/images/__mocks__/placeholder.jpg', `public/${storageKey}`);
    photos.push(
        await payload.create({
            collection: 'client-photos',
            overrideAccess: true,
            data: {
                gallery: created.id,
                originalFilename: `Live-${String(index + 1).padStart(2, '0')}.jpg`,
                storageKey,
                thumbnailKey: storageKey,
                byteSize: 1000,
                mimeType: 'image/jpeg',
                width: 1200,
                height: 800,
                checksum: `editor-${index}`,
            },
        }),
    );
}
const content = detailsFromText('A Mixed-case heading\nBody copy stays in Archivo.\nVenue · Mixed Case');
const heading = content.root.children[0];
const body = content.root.children[1];
const metadata = content.root.children[2];
assert.ok(heading && body && metadata);
heading.type = 'heading';
heading.tag = 'h2';
body.children = [
    { type: 'text', version: 1, text: 'Body copy stays in Archivo. ', format: 0, detail: 0, mode: 'normal', style: '' },
    {
        type: 'link',
        version: 3,
        direction: null,
        format: '',
        indent: 0,
        fields: { linkType: 'custom', url: 'mailto:qa@example.test', newTab: false },
        children: [{ type: 'text', version: 1, text: 'Get in Touch', format: 0, detail: 0, mode: 'normal', style: '' }],
    },
];
metadata.children = [
    {
        type: 'text',
        version: 1,
        text: 'Venue · Mixed Case',
        format: 0,
        detail: 0,
        mode: 'normal',
        style: '',
        $: { deliveryStyle: 'metadata' },
    },
];
let gallery = await payload.update({
    collection: 'client-galleries',
    id: created.id,
    overrideAccess: true,
    data: {
        cover: photos[0]?.id,
        details: content,
        blocks: [
            {
                blockType: 'photos',
                menuLabel: 'The stage',
                introduction: content,
                photos: photos.slice(0, 3).map((photo) => photo.id),
                colors: { background: '#151611', text: '#FAFFEF' },
            },
            { blockType: 'text', content, colors: { background: '#FAFFEF', text: '#151611' } },
            {
                blockType: 'photos',
                menuLabel: 'The crowd',
                photos: photos.slice(3, 6).map((photo) => photo.id),
                colors: { background: '#F0F3E6', text: '#151611' },
            },
        ],
        _status: 'published',
    },
});
const first = gallery.blocks?.[0];
assert.ok(first?.blockType === 'photos');
assert.equal(first.menuLabel, 'The stage');
assert.ok(!first.title);
assert.match(first.anchor ?? '', /^section-/);
assert.deepEqual(first.introduction, content);
const originalAnchor = first.anchor;
const originalRevision = gallery.photoRevision;
gallery = await payload.update({
    collection: 'client-galleries',
    id: created.id,
    overrideAccess: true,
    data: {
        blocks: gallery.blocks?.map((block) =>
            block.id === first.id ? { ...block, menuLabel: 'Stage moments', anchor: 'attempted-change' } : block,
        ),
    },
});
assert.equal(gallery.blocks?.[0]?.blockType, 'photos');
assert.equal(gallery.blocks?.[0]?.anchor, originalAnchor);
assert.equal(gallery.photoRevision, originalRevision);
await assert.rejects(
    payload.update({
        collection: 'client-galleries',
        id: created.id,
        overrideAccess: true,
        data: {
            blocks: gallery.blocks?.map((block) => (block.id === first.id ? { ...block, menuLabel: '   ' } : block)),
        },
    }),
    /Menu label/,
);
// Simulate an old section without its new field; reads and the next save normalize its label.
const collection = payload.db.collections['client-galleries'];
const raw = await collection.collection.findOne({ shareId: created.shareId });
assert.ok(raw);
await collection.collection.updateOne(
    { _id: raw._id },
    { $set: { 'blocks.0.title': 'Legacy label' }, $unset: { 'blocks.0.menuLabel': 1 } },
);
const legacy = await payload.findByID({ collection: 'client-galleries', id: created.id, overrideAccess: true });
assert.equal(legacy.blocks?.[0]?.menuLabel, 'Legacy label');
gallery = await payload.update({
    collection: 'client-galleries',
    id: created.id,
    overrideAccess: true,
    data: { blocks: legacy.blocks },
});
assert.equal(gallery.photoRevision, originalRevision);
assert.equal(gallery.blocks?.[0]?.anchor, originalAnchor);
const page = await payload.find({
    collection: 'client-photos',
    where: { gallery: { equals: created.id } },
    limit: 24,
    page: 1,
    sort: '-createdAt,-id',
    depth: 0,
    overrideAccess: true,
});
assert.equal(page.docs.length, 24);
assert.equal(page.totalDocs, 26);
assert.equal(page.totalPages, 2);
assert.ok(page.docs.every((photo) => photo.gallery === created.id));
await writeFile(
    path.join(tmpdir(), 'client-gallery-editor-qa.json'),
    JSON.stringify({
        email,
        password,
        id: created.id,
        shareId: created.shareId,
        photoIds: photos.map((photo) => photo.id),
    }),
    { mode: 0o600 },
);
console.log(
    'PASS: label-only publication, rich-text metadata, required labels, immutable anchors, unchanged photo revisions, legacy labels, and gallery-filtered pagination.',
);
console.log(`Preview fixture: http://localhost:3003/deliveries/${created.shareId}`);
await payload.destroy();
process.exit(0);
