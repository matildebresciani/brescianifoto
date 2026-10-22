// Run only as a local QA fixture. It always uses a dedicated loopback MongoDB database.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPayload } from 'payload';
import sharp from 'sharp';

process.chdir(fileURLToPath(new URL('../apps/web', import.meta.url)));
process.loadEnvFile('.env.development');
process.env.NODE_ENV = 'development';
process.env.DATABASE_URI = 'mongodb://127.0.0.1:27017/brescianifoto_client_delivery_qa';
process.env.R2_PUBLIC_URL = 'http://localhost:3001';
process.env.NEXT_PUBLIC_SERVER_URL = 'http://localhost:3001';
delete process.env.CLIENT_R2_BUCKET;
delete process.env.R2_BUCKET;
const { default: config } = await import('../apps/web/src/payload.config.ts');
const payload = await getPayload({ config });
const password = randomBytes(24).toString('hex');
const email = `delivery-qa-${Date.now()}@example.test`;
const admin = await payload.create({
    collection: 'users',
    data: { name: 'Delivery QA', email, password },
    overrideAccess: true,
});
const gallery = await payload.create({
    collection: 'client-galleries',
    data: {
        name: 'Delivery QA — isolated database',
        title: 'Alex & Jamie',
        subtitle: 'Our wedding day, in photographs',
        date: '2026-08-15T00:00:00.000Z',
        location: 'Copenhagen',
        _status: 'draft',
    },
    overrideAccess: true,
});
assert.match(gallery.shareId, /^[\w-]{32}$/);
const images = [];
const directory = 'public/images/client-delivery-qa';
await mkdir(directory, { recursive: true });
const source = await readFile('public/images/__mocks__/placeholder.jpg');
for (let i = 0; i < 12; i++) {
    const filename = `${gallery.id}-${i}.jpg`;
    const width = i % 3 === 0 ? 900 : 1200;
    const height = i % 3 === 0 ? 1200 : 800;
    const bytes = await sharp(source).resize(width, height, { fit: 'cover' }).jpeg().toBuffer();
    await writeFile(`${directory}/${filename}`, bytes);
    images.push(
        await payload.create({
            collection: 'client-photos',
            overrideAccess: true,
            data: {
                gallery: gallery.id,
                originalFilename: `Wedding-${String(i + 1).padStart(3, '0')}.jpg`,
                storageKey: `images/client-delivery-qa/${filename}`,
                byteSize: bytes.length,
                mimeType: 'image/jpeg',
                width,
                height,
                checksum: `qa-${i}`,
                thumbnailKey: `images/client-delivery-qa/${filename}`,
            },
        }),
    );
}
const content = {
    root: {
        type: 'root',
        children: [
            {
                type: 'paragraph',
                format: 'center',
                indent: 0,
                version: 1,
                children: [
                    {
                        type: 'text',
                        text: 'The people, the quiet moments, and everything in between. Thank you for letting me be part of your day.',
                        format: 0,
                        style: '',
                        detail: 0,
                        mode: 'normal',
                        version: 1,
                    },
                ],
            },
        ],
        format: '',
        indent: 0,
        version: 1,
    },
};
let saved = await payload.update({
    collection: 'client-galleries',
    id: gallery.id,
    overrideAccess: true,
    data: {
        cover: images[0].id,
        blocks: [
            { blockType: 'text', content },
            {
                blockType: 'photos',
                title: 'The ceremony',
                introduction: content,
                colors: { background: '#151611', text: '#FAFFEF' },
                photos: images.slice(0, 6).map((p) => p.id),
            },
            { blockType: 'photos', title: 'Dinner & dancing', photos: images.slice(6).map((p) => p.id) },
        ],
        _status: 'published',
    },
});
assert.equal(saved.shareId, gallery.shareId);
assert.deepEqual(saved.blocks[1].introduction, content);
assert.equal(saved.blocks[1].colors.background, '#151611');
assert.equal(saved.blocks[1].colors.text, '#FAFFEF');
const nativePhoto = await payload.findByID({ collection: 'client-photos', id: images[0].id, overrideAccess: true });
assert.equal(nativePhoto.filename, images[0].originalFilename);
assert.equal(nativePhoto.url, `http://localhost:3001/${images[0].storageKey}`);
assert.equal(nativePhoto.thumbnailURL, `http://localhost:3001/${images[0].thumbnailKey}`);
assert.equal(nativePhoto.sizes.thumbnail.url, nativePhoto.thumbnailURL);
const paletteBlocks = structuredClone(saved.blocks);
paletteBlocks[1].colors = { backgroundSource: 'text', textSource: 'background' };
saved = await payload.update({
    collection: 'client-galleries',
    id: gallery.id,
    overrideAccess: true,
    data: { blocks: paletteBlocks },
});
assert.equal(saved.blocks[1].colors.backgroundSource, 'text');
assert.equal(saved.blocks[1].colors.textSource, 'background');
const firstAnchor = saved.blocks[1].anchor;
const revision = saved.photoRevision;
assert.ok(firstAnchor.startsWith('section-'));
// Library-only uploads must neither enter a section nor alter the delivered photo set.
await writeFile(
    `public/${images[0].storageKey.replace('.jpg', '-library.jpg')}`,
    await readFile(`public/${images[0].storageKey}`),
);
const libraryPhoto = await payload.create({
    collection: 'client-photos',
    overrideAccess: true,
    data: {
        gallery: gallery.id,
        originalFilename: 'Library-only.jpg',
        storageKey: images[0].storageKey.replace('.jpg', '-library.jpg'),
        thumbnailKey: images[0].thumbnailKey,
        byteSize: images[0].byteSize,
        mimeType: 'image/jpeg',
        width: images[0].width,
        height: images[0].height,
        checksum: 'qa-library-only',
    },
});
saved = await payload.update({
    collection: 'client-galleries',
    id: gallery.id,
    overrideAccess: true,
    data: { blocks: saved.blocks },
});
assert.equal(saved.photoRevision, revision);
assert.ok(!saved.blocks.some((block) => block.blockType === 'photos' && block.photos.includes(libraryPhoto.id)));
const library = await payload.find({
    collection: 'client-photos',
    where: { gallery: { equals: gallery.id } },
    limit: 5,
    depth: 0,
    overrideAccess: true,
});
assert.equal(library.totalDocs, images.length + 1);
assert.ok(library.hasNextPage);
const archive = await payload.create({
    collection: 'client-downloads',
    overrideAccess: true,
    data: {
        gallery: gallery.id,
        originalFilename: 'Wedding.zip',
        storageKey: `qa-${gallery.id}.zip`,
        byteSize: 123456789,
        mimeType: 'application/zip',
        photoRevision: revision,
    },
});
saved = await payload.update({
    collection: 'client-galleries',
    id: gallery.id,
    overrideAccess: true,
    data: { archive: archive.id },
});
assert.equal(saved.archiveRevision, revision);
const secondBlocks = structuredClone(saved.blocks);
secondBlocks[1].title = 'Ceremony, renamed';
secondBlocks[1].photos.reverse();
saved = await payload.update({
    collection: 'client-galleries',
    id: gallery.id,
    overrideAccess: true,
    data: { blocks: secondBlocks },
});
assert.equal(saved.blocks[1].anchor, firstAnchor);
assert.equal(saved.photoRevision, revision);
secondBlocks[1].photos.pop();
saved = await payload.update({
    collection: 'client-galleries',
    id: gallery.id,
    overrideAccess: true,
    data: { blocks: secondBlocks },
});
assert.notEqual(saved.photoRevision, saved.archiveRevision);
saved = await payload.update({
    collection: 'client-galleries',
    id: gallery.id,
    overrideAccess: true,
    data: { confirmArchive: true },
});
assert.equal(saved.photoRevision, saved.archiveRevision);
assert.equal(saved.confirmArchive, false);
await assert.rejects(
    payload.update({
        collection: 'client-galleries',
        id: gallery.id,
        overrideAccess: true,
        data: {
            theme: { background: '#ffffff', surface: '#ffffff', text: '#ffffff', muted: '#ffffff', border: '#eeeeee' },
        },
    }),
    /contrast/,
);
const invalidSections = structuredClone(saved.blocks);
invalidSections[1].colors = {
    backgroundSource: 'custom',
    textSource: 'custom',
    background: '#FFFFFF',
    text: '#FFFFFF',
};
await assert.rejects(
    payload.update({
        collection: 'client-galleries',
        id: gallery.id,
        overrideAccess: true,
        data: { blocks: invalidSections },
    }),
    /Section 2:/,
);
assert.deepEqual(saved.blocks[1].introduction, content);
const other = await payload.create({
    collection: 'client-galleries',
    overrideAccess: true,
    data: { name: 'Other gallery', title: 'Other', _status: 'draft' },
});
await assert.rejects(
    payload.update({
        collection: 'client-galleries',
        id: other.id,
        overrideAccess: true,
        data: { cover: images[0].id },
    }),
    /belonging/,
);
for (const collection of ['client-galleries', 'client-photos', 'client-downloads']) {
    await assert.rejects(payload.find({ collection, overrideAccess: false, user: null }));
}
// Remove the fixture ZIP from the preview because no archive bytes were uploaded.
await payload.update({
    collection: 'client-galleries',
    id: gallery.id,
    overrideAccess: true,
    data: { archive: null, coverLayout: 'editorial' },
});
await writeFile(
    path.join(tmpdir(), 'client-gallery-qa.json'),
    JSON.stringify({ email, password, id: gallery.id, shareId: gallery.shareId, userId: admin.id }),
    { mode: 0o600 },
);
console.log(
    'PASS: real Payload create/publish, native upload metadata, palette references, stable links and anchors, archive revision/reorder/staleness/confirmation, contrast validation, cross-gallery rejection, anonymous collection denial.',
);
console.log(`Preview fixture: http://localhost:3001/deliveries/${gallery.shareId}`);
await payload.destroy();

process.exit(0);
