import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/(delivery)/deliveries/[shareId]/download/[assetId]/route';

const mocks = vi.hoisted(() => ({ read: vi.fn(), sign: vi.fn() }));
vi.mock('./read', () => ({ readDelivery: mocks.read }));
vi.mock('./storage', () => ({ originalDownloadURL: mocks.sign }));
const photo = { id: 'photo', storageKey: 'client-deliveries/random.jpg', originalFilename: 'Wedding.jpg' };
const archive = { id: 'archive', storageKey: 'client-deliveries/random.zip', originalFilename: 'Wedding.zip' };
const data = {
    gallery: {
        canDownloadPhotos: true,
        canDownloadArchive: true,
        blocks: [{ blockType: 'photos', title: 'Wedding', photos: ['photo'] }],
    },
    photos: [photo, { ...photo, id: 'cover-only' }],
    archive,
    isArchiveCurrent: true,
};
const request = (assetId: string) =>
    GET(new Request('https://example.com/deliveries/link/download/file'), {
        params: Promise.resolve({ shareId: 'a'.repeat(32), assetId }),
    });

beforeEach(() => {
    mocks.read.mockResolvedValue(data);
    mocks.sign.mockResolvedValue('https://storage.example.test/signed-file');
});

describe('client download authorization', () => {
    it('redirects to storage without buffering bytes and prevents redirect caching/indexing', async () => {
        const response = await request('photo');
        expect(response.status).toBe(302);
        expect(response.headers.get('location')).toBe('https://storage.example.test/signed-file');
        expect(response.headers.get('cache-control')).toContain('no-store');
        expect(response.headers.get('x-robots-tag')).toContain('noindex');
        expect(mocks.sign).toHaveBeenCalledWith(photo.storageKey, photo.originalFilename);
    });
    it.each(['foreign-photo', 'cover-only'])('rejects unselected asset %s even when its ID is known', async (id) => {
        expect((await request(id)).status).toBe(404);
        expect(mocks.sign).not.toHaveBeenCalled();
    });
    it('rejects a stale ZIP at its endpoint, not just in the UI', async () => {
        mocks.read.mockResolvedValue({ ...data, isArchiveCurrent: false });
        expect((await request('archive')).status).toBe(404);
        expect(mocks.sign).not.toHaveBeenCalled();
    });
    it('honors both download switches', async () => {
        mocks.read.mockResolvedValue({
            ...data,
            gallery: { ...data.gallery, canDownloadPhotos: false, canDownloadArchive: false },
        });
        expect((await request('photo')).status).toBe(404);
        expect((await request('archive')).status).toBe(404);
    });
    it('rejects unpublished galleries and reports temporary signing failure', async () => {
        mocks.read.mockResolvedValueOnce(undefined);
        expect((await request('photo')).status).toBe(404);
        mocks.sign.mockRejectedValueOnce(new Error('Storage unavailable'));
        expect((await request('photo')).status).toBe(503);
    });
});
