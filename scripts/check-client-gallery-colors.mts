// Isolated local integration fixture; never connects to a production database or object storage.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPayload, ValidationError } from 'payload';
import sharp from 'sharp';

process.chdir(fileURLToPath(new URL('../apps/web', import.meta.url)));
process.loadEnvFile('.env.development');
process.env.NODE_ENV = 'development';
process.env.DATABASE_URI = 'mongodb://127.0.0.1:27017/brescianifoto_client_colors_qa';
process.env.NEXT_PUBLIC_SERVER_URL = 'http://localhost:3002';
delete process.env.CLIENT_R2_BUCKET;
delete process.env.R2_BUCKET;
const { default: config } = await import('../apps/web/src/payload.config.ts');
const payload = await getPayload({ config });
const password = randomBytes(24).toString('hex');
const email = `colors-qa-${Date.now()}@example.test`;
await payload.create({ collection: 'users', data: { name: 'Color QA', email, password }, overrideAccess: true });
let gallery = await payload.create({
    collection: 'client-galleries',
    overrideAccess: true,
    data: { name: 'Gallery color QA — local placeholders', title: 'Orange & green', _status: 'draft' },
});
// Publication-only requirements must target their fields without preventing empty draft saves.
await assert.rejects(
    payload.update({
        collection: 'client-galleries',
        id: gallery.id,
        overrideAccess: true,
        data: { _status: 'published' },
    }),
    (error) => {
        assert.ok(error instanceof ValidationError);
        assert.deepEqual(
            error.data?.errors.map((entry) => entry.path),
            ['cover', 'blocks'],
        );
        assert.ok(error.data?.errors.every((entry) => entry.message.includes('draft')));
        return true;
    },
);
gallery = await payload.update({
    collection: 'client-galleries',
    id: gallery.id,
    overrideAccess: true,
    draft: true,
    data: { title: 'Orange & green', _status: 'draft' },
});
const metadata = await sharp('public/images/__mocks__/placeholder.jpg').metadata();
const storageKey = `images/client-delivery-qa/colors-${gallery.id}.jpg`;
await mkdir('public/images/client-delivery-qa', { recursive: true });
await copyFile('public/images/__mocks__/placeholder.jpg', `public/${storageKey}`);
const photo = await payload.create({
    collection: 'client-photos',
    overrideAccess: true,
    data: {
        gallery: gallery.id,
        originalFilename: 'Local placeholder.jpg',
        storageKey,
        thumbnailKey: storageKey,
        byteSize: 1,
        mimeType: 'image/jpeg',
        width: metadata.width,
        height: metadata.height,
        checksum: 'local-color-fixture',
    },
});
const content = {
    root: {
        type: 'root',
        version: 1,
        direction: 'ltr',
        format: '',
        indent: 0,
        children: [
            {
                type: 'paragraph',
                version: 1,
                format: '',
                indent: 0,
                children: [
                    {
                        type: 'text',
                        version: 1,
                        text: 'A gallery in tangerine, pistachio and retro green.',
                        format: 0,
                        style: '',
                        detail: 0,
                        mode: 'normal',
                    },
                ],
            },
        ],
    },
};
gallery = await payload.update({
    collection: 'client-galleries',
    id: gallery.id,
    overrideAccess: true,
    data: {
        cover: photo.id,
        blocks: [
            { blockType: 'text', content },
            { blockType: 'photos', title: 'Tangerine', photos: [photo.id] },
            { blockType: 'photos', title: 'Retro green', introduction: content, photos: [photo.id] },
        ],
    },
});
assert.equal(gallery.blocks[1].colors.textSource, 'inherit');
// Simulate pre-token documents without defaults being applied on creation.
await payload.db.collections['client-galleries'].collection.updateOne(
    { _id: new (await import('mongoose')).Types.ObjectId(gallery.id) },
    { $unset: { 'blocks.0.colors': 1 } },
);
await payload.db.versions['client-galleries'].collection.updateMany(
    { parent: new (await import('mongoose')).Types.ObjectId(gallery.id) },
    { $unset: { 'version.blocks.0.colors': 1 } },
);
gallery = await payload.findByID({ collection: 'client-galleries', id: gallery.id, overrideAccess: true });
gallery = await payload.update({
    collection: 'client-galleries',
    id: gallery.id,
    overrideAccess: true,
    data: { blocks: gallery.blocks },
});
assert.ok(!gallery.blocks[0].colors?.textSource);
// Simulate a previously saved pair palette in both the document and draft history.
const legacyTheme = {
    background: '#E9E9C7',
    surface: '#E9E9C7',
    text: '#30673A',
    muted: '#30673A',
    border: '#30673A',
    highlights: [
        { key: 'tangerine', name: 'Tangerine', background: '#E3792F', text: '#151611' },
        { key: 'retro-green', name: 'Retro green', background: '#30673A', text: '#E9E9C7' },
    ],
};
const legacyColors = { backgroundSource: 'bg-highlight-tangerine', textSource: 'automatic' };
const objectId = new (await import('mongoose')).Types.ObjectId(gallery.id);
await payload.db.collections['client-galleries'].collection.updateOne(
    { _id: objectId },
    { $set: { theme: legacyTheme, 'blocks.1.colors': legacyColors } },
);
await payload.db.versions['client-galleries'].collection.updateMany(
    { parent: objectId },
    { $set: { 'version.theme': legacyTheme, 'version.blocks.1.colors': legacyColors } },
);
gallery = await payload.findByID({ collection: 'client-galleries', id: gallery.id, overrideAccess: true });
assert.equal(gallery.theme.colors.length, 4);
const { resolveSectionTheme } = await import('../apps/web/src/lib/client-deliveries/theme.ts');
assert.equal(resolveSectionTheme(gallery.theme, gallery.blocks[1].colors).theme.text, '#151611');
gallery = await payload.update({
    collection: 'client-galleries',
    id: gallery.id,
    overrideAccess: true,
    data: { title: gallery.title },
});
assert.equal(gallery.theme.colors.length, 4);
const blocks = structuredClone(gallery.blocks);
blocks[1].colors = { backgroundSource: 'color-tangerine', textSource: 'color-void' };
blocks[2].colors = { backgroundSource: 'color-retro-green', textSource: 'color-soft-pistachio' };
gallery = await payload.update({
    collection: 'client-galleries',
    id: gallery.id,
    overrideAccess: true,
    data: {
        blocks,
        _status: 'published',
        theme: {
            background: 'color-soft-pistachio',
            surface: 'color-soft-pistachio',
            text: 'color-retro-green',
            muted: 'color-retro-green',
            border: 'color-retro-green',
            bgInvert: 'color-retro-green',
            fgOnColor: 'color-soft-pistachio',
            highlights: [],
            colors: [
                { key: 'tangerine', name: 'Tangerine', hex: '#E3792F' },
                { key: 'soft-pistachio', name: 'Soft pistachio', hex: '#E9E9C7' },
                { key: 'retro-green', name: 'Retro green', hex: '#30673A' },
                { key: 'void', name: 'Void', hex: '#151611' },
            ],
        },
    },
});
const originalKeys = new Map(gallery.theme.colors.map((entry) => [entry.id, entry.key]));
const colors = [...gallery.theme.colors]
    .reverse()
    .map((entry) => ({ ...entry, name: `${entry.name} renamed`, key: 'attempted-change' }));
gallery = await payload.update({
    collection: 'client-galleries',
    id: gallery.id,
    overrideAccess: true,
    data: { theme: { ...gallery.theme, colors } },
});
for (const entry of gallery.theme.colors) assert.equal(entry.key, originalKeys.get(entry.id));
for (const draft of [false, true]) {
    await assert.rejects(
        payload.update({
            collection: 'client-galleries',
            id: gallery.id,
            overrideAccess: true,
            draft,
            data: {
                theme: { ...gallery.theme, colors: gallery.theme.colors.filter((entry) => entry.key !== 'tangerine') },
                ...(draft ? { _status: 'draft' } : {}),
            },
        }),
        /Section 2 \(Tangerine\).*color-tangerine is missing/,
    );
    await assert.rejects(
        payload.update({
            collection: 'client-galleries',
            id: gallery.id,
            overrideAccess: true,
            draft,
            data: {
                theme: {
                    ...gallery.theme,
                    colors: gallery.theme.colors.filter((entry) => entry.key !== 'retro-green'),
                },
                ...(draft ? { _status: 'draft' } : {}),
            },
        }),
        /uses missing color color-retro-green/,
    );
}
await assert.rejects(
    payload.update({
        collection: 'client-galleries',
        id: gallery.id,
        overrideAccess: true,
        data: {
            blocks: gallery.blocks.map((block, index) =>
                index === 1 ? { ...block, colors: { ...block.colors, textSource: 'color-soft-pistachio' } } : block,
            ),
        },
    }),
    /contrast.*Section 2/,
);
gallery = await payload.findByID({ collection: 'client-galleries', id: gallery.id, overrideAccess: true });
assert.equal(gallery.blocks[1].colors.backgroundSource, 'color-tangerine');
// New palette entries no longer need a name; generated variables remain stable after save/reload.
gallery = await payload.update({
    collection: 'client-galleries',
    id: gallery.id,
    overrideAccess: true,
    data: { theme: { ...gallery.theme, colors: [...gallery.theme.colors, { hex: '#112233' }] } },
});
const nameless = gallery.theme.colors.find((entry) => entry.hex === '#112233');
assert.ok(nameless?.key);
assert.ok(!nameless.name);
const namelessReference = `color-${nameless.key}`;
gallery = await payload.update({
    collection: 'client-galleries',
    id: gallery.id,
    overrideAccess: true,
    data: {
        theme: {
            ...gallery.theme,
            border: namelessReference,
            colors: [...gallery.theme.colors]
                .reverse()
                .map((entry) => (entry.id === nameless.id ? { ...entry, hex: '#223344' } : entry)),
        },
        blocks: gallery.blocks.map((block, index) =>
            index === 1
                ? { ...block, colors: { backgroundSource: namelessReference, textSource: 'color-soft-pistachio' } }
                : block,
        ),
    },
});
gallery = await payload.findByID({ collection: 'client-galleries', id: gallery.id, overrideAccess: true });
assert.equal(gallery.theme.colors.find((entry) => entry.id === nameless.id).key, nameless.key);
assert.equal(resolveSectionTheme(gallery.theme, gallery.blocks[1].colors).theme.background, '#223344');
assert.equal(gallery.theme.border, namelessReference);
await assert.rejects(
    payload.update({
        collection: 'client-galleries',
        id: gallery.id,
        overrideAccess: true,
        draft: true,
        data: {
            theme: { ...gallery.theme, colors: gallery.theme.colors.filter((entry) => entry.id !== nameless.id) },
        },
    }),
    /uses missing color/,
);
await writeFile(
    path.join(tmpdir(), 'client-gallery-colors-qa.json'),
    JSON.stringify({ email, password, id: gallery.id, shareId: gallery.shareId }),
    { mode: 0o600 },
);
console.log(
    'PASS: field-specific publication errors, empty draft saves, legacy inheritance, new-section defaults, legacy pair deduplication, nameless reusable colors, stable keys after hex edits/reorder/reload, token/section deletion protection, reference validation and publication contrast.',
);
console.log(`Color fixture: http://localhost:3002/deliveries/${gallery.shareId}`);
await payload.destroy();
process.exit(0);
