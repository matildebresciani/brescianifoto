import { createHash, createHmac } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handlePublicPhotoMaintenance } from './public-photo-maintenance.mjs';

const mocks = vi.hoisted(() => ({ plan: vi.fn() }));
vi.mock('../utilities/public-photo-migration.mjs', () => ({ planPublicPhotoMigration: mocks.plan }));
vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }));
const plan = { changes: [], selections: [], unmatched: [], recoveredGalleries: [], visibility: [] };
const secret = 'maintenance-test-secret';
const req = (method = 'GET', body = '') => ({
    url: 'https://www.brescianifoto.dk/api/maintenance/public-photos',
    user: { id: 'admin', collection: 'users' },
    method,
    text: async () => body,
    payload: { config: { secret }, db: { connection: { db: {}, base: { mongo: { BSON: { EJSON: JSON } } } } } },
});
beforeEach(() => mocks.plan.mockResolvedValue(plan));

describe('public photo maintenance authorization', () => {
    it('rejects anonymous and client users before querying data', async () => {
        expect((await handlePublicPhotoMaintenance({ user: null })).status).toBe(401);
        expect((await handlePublicPhotoMaintenance({ user: { collection: 'clients' } })).status).toBe(401);
        expect(mocks.plan).not.toHaveBeenCalled();
    });
    it('previews without performing any writes and escapes report content', async () => {
        mocks.plan.mockResolvedValue({ ...plan, unmatched: ['<script>'] });
        const response = await handlePublicPhotoMaintenance(req());
        expect(response.status).toBe(200);
        expect(response.headers.get('Cache-Control')).toContain('no-store');
        const body = await response.text();
        expect(body).toContain('&lt;script&gt;');
        expect(body).toContain('Read-only production preview');
    });
    it('rejects unsigned, expired and outdated previews', async () => {
        expect((await handlePublicPhotoMaintenance(req('POST'))).status).toBe(409);
        for (const timestamp of [String(Date.now() - 700000), String(Date.now())]) {
            const fingerprint = createHash('sha256').update('outdated plan').digest('hex');
            const signature = createHmac('sha256', secret)
                .update(`public-photo-migration:${timestamp}:${fingerprint}`)
                .digest('hex');
            const body = new URLSearchParams({ timestamp, signature }).toString();
            expect((await handlePublicPhotoMaintenance(req('POST', body))).status).toBe(409);
        }
    });
});
