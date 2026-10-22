import { describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/(delivery)/deliveries/[shareId]/social-image/route';

const mocks = vi.hoisted(() => ({ read: vi.fn(), photo: vi.fn(), render: vi.fn() }));
vi.mock('./read', () => ({ readDelivery: mocks.read }));
vi.mock('./social', () => ({ featuredPhoto: mocks.photo, renderSocialImage: mocks.render }));
const params = Promise.resolve({ shareId: 'a'.repeat(32) });
const request = () => new Request('https://example.test/deliveries/link/social-image');

describe('social image access', () => {
    it('rejects preview requests without reading draft or published content', async () => {
        const response = await GET(new Request(`${request().url}?preview=1`), { params });
        expect(response.status).toBe(404);
        expect(mocks.read).not.toHaveBeenCalled();
    });
    it('returns 404 when unpublished, missing, or lacking an owned featured image', async () => {
        mocks.read.mockResolvedValue(undefined);
        expect((await GET(request(), { params })).status).toBe(404);
        mocks.read.mockResolvedValue({ gallery: {} });
        mocks.photo.mockReturnValue(undefined);
        expect((await GET(request(), { params })).status).toBe(404);
        expect(mocks.render).not.toHaveBeenCalled();
    });
    it('rechecks publication every time, serves JPEG bytes and disables caching/indexing', async () => {
        mocks.read.mockResolvedValue({ gallery: { focalX: 0, focalY: 100 } });
        mocks.photo.mockReturnValue({ id: 'photo' });
        mocks.render.mockResolvedValue(Buffer.from('image bytes'));
        const response = await GET(request(), { params });
        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toBe('image/jpeg');
        expect(response.headers.get('cache-control')).toContain('no-store');
        expect(response.headers.get('x-robots-tag')).toContain('noindex');
        expect(mocks.render).toHaveBeenCalledWith({ id: 'photo' }, 0, 100);
        mocks.read.mockResolvedValue(undefined);
        expect((await GET(request(), { params })).status).toBe(404);
    });
    it('reports temporary storage failure without exposing internals', async () => {
        mocks.read.mockRejectedValue(new Error('private credentials'));
        const response = await GET(request(), { params });
        expect(response.status).toBe(503);
        expect(await response.text()).not.toContain('credentials');
    });
});
