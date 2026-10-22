import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { assetURL, deliveryStorage, originalDownloadURL } from './storage';

describe('dedicated client storage', () => {
    beforeEach(() => {
        vi.stubEnv('R2_BUCKET', 'portfolio');
        vi.stubEnv('R2_ENDPOINT', 'https://portfolio.example.test');
        vi.stubEnv('R2_PUBLIC_URL', 'https://portfolio.example.test');
        vi.stubEnv('R2_ACCESS_KEY_ID', 'portfolio-key');
        vi.stubEnv('R2_SECRET_ACCESS_KEY', 'portfolio-secret');
        vi.stubEnv('CLIENT_R2_BUCKET', 'client-galleries');
        vi.stubEnv('CLIENT_R2_ENDPOINT', 'https://clients.example.test');
        vi.stubEnv('CLIENT_R2_ACCESS_KEY_ID', 'client-key');
        vi.stubEnv('CLIENT_R2_SECRET_ACCESS_KEY', 'client-secret');
    });

    afterEach(() => vi.unstubAllEnvs());

    it('serves only local QA placeholders without credentials in development', async () => {
        vi.stubEnv('NODE_ENV', 'development');
        vi.stubEnv('CLIENT_R2_BUCKET', undefined);
        vi.stubEnv('NEXT_PUBLIC_SERVER_URL', 'http://localhost:3001');
        expect(await assetURL('images/client-delivery-qa/photo.jpg')).toBe(
            'http://localhost:3001/images/client-delivery-qa/photo.jpg',
        );
        await expect(assetURL('client-deliveries/gallery/photo.jpg')).rejects.toThrow();
        vi.stubEnv('NODE_ENV', 'production');
        await expect(assetURL('images/client-delivery-qa/photo.jpg')).rejects.toThrow();
    });

    it('signs image and download access to the dedicated bucket without a public URL', async () => {
        const image = new URL(await assetURL('client-deliveries/gallery/first photo.jpg'));
        expect(image.hostname).toBe('clients.example.test');
        expect(image.pathname).toBe('/client-galleries/client-deliveries/gallery/first%20photo.jpg');
        expect(image.searchParams.get('X-Amz-Credential')).toMatch(/^client-key\//);
        expect(image.searchParams.get('X-Amz-Expires')).toBe('86400');
        expect(image.searchParams.get('X-Amz-Signature')).toBeTruthy();
        expect(image.searchParams.has('response-content-disposition')).toBe(false);
        const url = new URL(await originalDownloadURL('client-deliveries/gallery/photo.jpg', 'Photo.jpg'));
        expect(url.hostname).toBe('clients.example.test');
        expect(url.pathname).toBe('/client-galleries/client-deliveries/gallery/photo.jpg');
        expect(url.searchParams.get('X-Amz-Credential')).toMatch(/^client-key\//);
        expect(url.searchParams.get('X-Amz-Expires')).toBe('900');
    });

    it('reuses identical image URLs within a UTC half-day and rotates at the boundary', async () => {
        const key = 'client-deliveries/gallery/photo.jpg';
        const first = await assetURL(key, new Date('2026-10-22T00:00:00Z'));
        const last = await assetURL(key, new Date('2026-10-22T11:59:59.999Z'));
        const next = await assetURL(key, new Date('2026-10-22T12:00:00Z'));
        expect(last).toBe(first);
        expect(next).not.toBe(first);
        expect(new URL(first).searchParams.get('X-Amz-Date')).toBe('20261022T000000Z');
        expect(new URL(next).searchParams.get('X-Amz-Date')).toBe('20261022T120000Z');
        expect(await assetURL(key, new Date('2026-10-22T23:59:59.999Z'))).toBe(next);
        expect(await assetURL(key, new Date('2026-10-23T00:00:00Z'))).not.toBe(next);
        expect(await assetURL('client-deliveries/gallery/replacement.jpg', new Date('2026-10-22T12:00:00Z'))).not.toBe(
            next,
        );
    });

    it.each([
        'CLIENT_R2_BUCKET',
        'CLIENT_R2_ACCESS_KEY_ID',
        'CLIENT_R2_SECRET_ACCESS_KEY',
        'CLIENT_R2_ENDPOINT',
    ])('rejects missing %s even when portfolio storage is configured', (name) => {
        vi.stubEnv(name, undefined);
        expect(() => deliveryStorage()).toThrow();
    });
});
