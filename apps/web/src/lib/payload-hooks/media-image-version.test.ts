import { mongooseAdapter } from '@payloadcms/db-mongodb';
import payload, { buildConfig, createLocalReq } from 'payload';
import { beforeAll, describe, expect, it } from 'vitest';
import type { Media } from '@/payload-types';
import { prepareMediaImageVersion, trackMediaFileUpload } from './media-image-version';

beforeAll(async () => {
    payload.config = await buildConfig({
        secret: 'media-version-unit-test',
        db: mongooseAdapter({ url: 'mongodb://127.0.0.1:27017/media-version-unit-test' }),
        collections: [{ slug: 'media', fields: [] }],
    });
});

const original: Media = {
    id: 'photo',
    filename: 'photo.jpg',
    filesize: 1000,
    width: 1200,
    height: 800,
    mimeType: 'image/jpeg',
    createdAt: '2026-10-14',
    updatedAt: '2026-10-21',
};

async function versionFor(
    data: Partial<Media>,
    options: {
        hasUpload?: boolean;
        hasCrop?: boolean;
        original?: Media;
        isCreate?: boolean;
        hasFocalReprocess?: boolean;
    } = {},
) {
    const req = await createLocalReq({}, payload);
    const collection = payload.config.collections.find((item) => item.slug === 'media');
    if (!collection) throw new Error('Missing test collection');
    const file = { data: Buffer.from('photo'), name: 'photo.jpg', mimetype: 'image/jpeg', size: 5 };
    if (options.hasUpload) req.file = file;
    trackMediaFileUpload({
        operation: 'update',
        req,
        collection,
        context: req.context,
        args: { data, req, collection: { config: collection }, where: { id: { equals: original.id } } },
    });
    if (options.hasFocalReprocess) req.file = file;
    if (options.hasCrop) req.query = { uploadEdits: { crop: { x: 0, y: 0, width: 50, height: 50 } } };
    const result = await prepareMediaImageVersion({
        data,
        originalDoc: options.isCreate ? undefined : (options.original ?? original),
        operation: options.isCreate ? 'create' : 'update',
        req,
        collection,
        context: req.context,
    });
    return result.imageVersion;
}

describe('media file version lifecycle', () => {
    it('pins legacy versions across metadata and focal-only edits, ignoring submitted cache versions', async () => {
        expect(await versionFor({ alt: 'New caption', imageVersion: 'client-value' })).toBe(original.updatedAt);
        expect(await versionFor({ focalX: 70 }, { hasFocalReprocess: true })).toBe(original.updatedAt);
        expect(
            await versionFor({ caption: null }, { original: { ...original, imageVersion: 'original-version' } }),
        ).toBe('original-version');
    });

    it('changes versions for new uploads, same-name replacements and in-place crops', async () => {
        const created = await versionFor(original, { isCreate: true, hasUpload: true });
        expect(created).toMatch(/^[\da-f-]{36}$/);
        expect(await versionFor({ filename: original.filename }, { hasUpload: true })).not.toBe(original.updatedAt);
        expect(await versionFor({}, { hasCrop: true })).not.toBe(original.updatedAt);
        expect(await versionFor({ width: 600 })).not.toBe(original.updatedAt);
    });
});
