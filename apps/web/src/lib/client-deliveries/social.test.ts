import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ClientGallery, ClientPhoto } from '@/payload-types';
import { deliveryMetadata, featuredPhoto, renderSocialImage, socialCrop } from './social';

const mocks = vi.hoisted(() => ({ read: vi.fn(), url: vi.fn() }));
vi.mock('./read', () => ({ readDelivery: mocks.read }));
vi.mock('./storage', () => ({ assetURL: mocks.url }));
vi.mock('@/lib/utilities/get-url', () => ({ getServerSideURL: () => 'https://example.test' }));

const photo: ClientPhoto = {
    id: 'photo-1',
    gallery: 'gallery-1',
    originalFilename: 'photo.jpg',
    storageKey: 'private/photo.jpg',
    byteSize: 2000,
    mimeType: 'image/jpeg',
    width: 1800,
    height: 900,
    checksum: 'immutable-checksum',
    thumbnailKey: 'thumb.webp',
    createdAt: '2026-10-01',
    updatedAt: '2026-10-01',
};
const gallery: ClientGallery = {
    id: 'gallery-1',
    name: 'INTERNAL PRIVATE NAME',
    title: 'Alex & Jamie',
    date: '2026-10-17T00:00:00.000Z',
    location: 'København',
    shareId: 'a'.repeat(32),
    cover: photo.id,
    blocks: [],
    _status: 'published',
    focalX: 0,
    focalY: 100,
    createdAt: '2026-10-01',
    updatedAt: '2026-10-01',
};
const data = { gallery, photos: [photo], archive: undefined, isArchiveCurrent: false };

afterEach(() => vi.unstubAllGlobals());

describe('delivery social previews', () => {
    it('uses one featured image with a stable absolute revision-qualified URL', async () => {
        mocks.read.mockResolvedValue(data);
        const metadata = await deliveryMetadata('a'.repeat(32), false);
        expect(metadata).toMatchObject({
            title: 'brescianifoto | Alex & Jamie',
            description: '17. oktober 2026 · København',
            alternates: { canonical: `https://example.test/deliveries/${'a'.repeat(32)}` },
            openGraph: {
                title: 'brescianifoto | Alex & Jamie',
                description: '17. oktober 2026 · København',
                siteName: 'brescianifoto',
                locale: 'da_DK',
                url: `https://example.test/deliveries/${'a'.repeat(32)}`,
                images: [
                    {
                        width: 1200,
                        height: 630,
                        type: 'image/jpeg',
                        url: expect.stringMatching(
                            /^https:\/\/example.test\/deliveries\/a{32}\/social-image\?v=[a-f0-9]{16}$/,
                        ),
                    },
                ],
            },
            twitter: {
                card: 'summary_large_image',
                title: 'brescianifoto | Alex & Jamie',
                description: '17. oktober 2026 · København',
            },
        });
        expect(JSON.stringify(metadata)).not.toContain(gallery.name);
        expect(mocks.url).not.toHaveBeenCalled();
        expect(await deliveryMetadata('a'.repeat(32), false)).toEqual(metadata);
        mocks.read.mockResolvedValue({ ...data, gallery: { ...gallery, focalX: 100 } });
        expect((await deliveryMetadata('a'.repeat(32), false)).openGraph).not.toEqual(metadata.openGraph);
    });
    it('uses the gallery title when no date or location is published', async () => {
        mocks.read.mockResolvedValue({ ...data, gallery: { ...gallery, date: null, location: null } });
        expect(await deliveryMetadata('a'.repeat(32), false)).toMatchObject({
            description: 'Billedgalleri med Alex & Jamie.',
            openGraph: { title: 'brescianifoto | Alex & Jamie', description: 'Billedgalleri med Alex & Jamie.' },
        });
    });
    it('never queries or exposes draft content in preview metadata', async () => {
        expect(await deliveryMetadata('a'.repeat(32), true)).toMatchObject({ openGraph: null, twitter: null });
        expect(mocks.read).not.toHaveBeenCalled();
    });
    it('omits social images for unavailable and cross-gallery photos', async () => {
        mocks.read.mockResolvedValue(undefined);
        expect(await deliveryMetadata('a'.repeat(32), false)).toMatchObject({ openGraph: null });
        const foreign = { ...data, photos: [{ ...photo, gallery: 'different-gallery' }] };
        expect(featuredPhoto(foreign)).toBeUndefined();
        mocks.read.mockResolvedValue(foreign);
        expect(await deliveryMetadata('a'.repeat(32), false)).toMatchObject({ openGraph: { images: [] } });
    });
    it('matches cover object-position at the center and all edges', () => {
        expect(socialCrop(1800, 900, 0, 0)).toMatchObject({ left: 0, top: 0 });
        expect(socialCrop(1800, 900, 100, 100)).toMatchObject({ left: 60, top: 0 });
        expect(socialCrop(900, 1800)).toMatchObject({ left: 0, top: 885 });
        expect(socialCrop(900, 1800, 100, 100)).toMatchObject({ left: 0, top: 1770 });
    });
    it('produces a colored 1200×630 JPEG without changing source bytes', async () => {
        const source = await sharp({ create: { width: 1800, height: 900, channels: 3, background: '#da2345' } })
            .jpeg()
            .toBuffer();
        const checksum = createHash('sha256').update(source).digest('hex');
        mocks.url.mockResolvedValue('https://storage.test/signed');
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(new Uint8Array(source))));
        const result = await renderSocialImage(photo, 0, 100);
        expect(result).toBeDefined();
        if (!result) return;
        expect(await sharp(result).metadata()).toMatchObject({ width: 1200, height: 630, format: 'jpeg' });
        const { channels } = await sharp(result).stats();
        expect(channels[0]?.mean).toBeGreaterThan(200);
        expect(channels[1]?.mean).toBeLessThan(50);
        expect(createHash('sha256').update(source).digest('hex')).toBe(checksum);
    });
    it('reuses a derived preview but regenerates it when its image or focal point changes', async () => {
        const source = await sharp({ create: { width: 1800, height: 900, channels: 3, background: '#da2345' } })
            .jpeg()
            .toBuffer();
        const fetchImage = vi.fn().mockImplementation(async () => new Response(new Uint8Array(source)));
        vi.stubGlobal('fetch', fetchImage);
        mocks.url.mockResolvedValue('https://storage.test/signed');
        const featured = { ...photo, checksum: 'cached-preview' };
        const first = await renderSocialImage(featured, 50, 50);
        expect(await renderSocialImage(featured, 50, 50)).toBe(first);
        expect(fetchImage).toHaveBeenCalledTimes(1);
        await renderSocialImage(featured, 0, 50);
        await renderSocialImage({ ...featured, checksum: 'updated-preview' }, 50, 50);
        expect(fetchImage).toHaveBeenCalledTimes(3);
    });
});
