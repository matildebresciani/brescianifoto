import { mongooseAdapter } from '@payloadcms/db-mongodb';
import { BasePayload, buildConfig, createLocalReq } from 'payload';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { ClientPhotos } from './assets';

vi.mock('@/lib/client-deliveries/storage', () => ({
    assetURL: async (key: string) => `https://storage.example.test/${key}?signed=asset`,
}));

const payload = new BasePayload();

beforeAll(async () => {
    // Sanitizing builds a real hook context without connecting to a database.
    payload.config = await buildConfig({
        secret: 'client-photo-library-test',
        db: mongooseAdapter({ url: 'mongodb://127.0.0.1/unused' }),
        collections: [ClientPhotos, { slug: 'client-galleries', fields: [] }],
    });
});

describe('client photo library thumbnails', () => {
    it('disables native cache tags so Payload preserves signed thumbnail URLs', () => {
        const collection = payload.config.collections.find((item) => item.slug === 'client-photos');
        expect(collection?.upload).toMatchObject({ cacheTags: false });
    });

    it('adapts existing storage records for native pickers and the Media grid without replacing the original', async () => {
        const req = await createLocalReq({}, payload);
        const collection = payload.config.collections.find((item) => item.slug === 'client-photos');
        const hook = ClientPhotos.hooks?.afterRead?.[0];
        if (!collection || !hook) throw new Error('Missing client photo hook');
        const doc = {
            id: 'photo',
            gallery: 'gallery',
            originalFilename: 'Concert.jpg',
            storageKey: 'gallery/photos/original.jpg',
            thumbnailKey: 'gallery/thumbnails/preview.webp',
            byteSize: 12_000_000,
            width: 6000,
            height: 4000,
        };
        const result = await hook({ collection, context: req.context, doc, req });

        expect(result.filename).toBe(doc.originalFilename);
        expect(result.url).toContain('/photos/original.jpg');
        expect(result.thumbnailURL).toContain('/thumbnails/preview.webp');
        expect(result.sizes.thumbnail.url).toBe(result.thumbnailURL);
        expect(result.sizes.thumbnail.url).not.toBe(result.url);
        expect(result.sizes.thumbnail.mimeType).toBe('image/webp');
        expect(result.gallery).toBe(doc.gallery);
        expect(doc).not.toHaveProperty('sizes');
    });
});
