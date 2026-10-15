import { mongooseAdapter } from '@payloadcms/db-mongodb';
import payload, { buildConfig, createLocalReq } from 'payload';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { signFestivalMaintenance } from '@/lib/utilities/maintenance-auth';
import type { Gallery } from '@/payload-types';
import { festivalURLMaintenance } from './festival-url-maintenance';

const secret = 'festival-maintenance-test';
const gallery: Gallery = {
    id: 'artist',
    title: 'Neckbreakker',
    slug: 'neckbreakker-copenhell',
    location: { id: 'copenhell', name: 'Copenhell 2026', createdAt: '', updatedAt: '' },
    tagGroup: { id: 'festivals', name: 'Festivals', createdAt: '', updatedAt: '' },
    publishStatus: 'public',
    gallery: [],
    createdAt: '',
    updatedAt: '',
};

beforeAll(async () => {
    payload.config = await buildConfig({
        secret,
        db: mongooseAdapter({ url: 'mongodb://127.0.0.1:27017/festival-maintenance-test' }),
        localization: { locales: ['da', 'en'], defaultLocale: 'da' },
        collections: [
            { slug: 'galleries', fields: [{ name: 'slug', type: 'text', localized: true }] },
            { slug: 'redirects', fields: [] },
        ],
    });
});

const makeRequest = async (mode: string, hasSignature = true) => {
    const timestamp = String(Date.now());
    const headers = new Headers(
        hasSignature
            ? {
                  'x-maintenance-timestamp': timestamp,
                  'x-maintenance-signature': signFestivalMaintenance(secret, mode, timestamp),
              }
            : {},
    );
    return createLocalReq(
        { req: { url: `http://localhost:3000/api/maintenance/festival-urls?mode=${mode}`, headers } },
        payload,
    );
};

const mockRecords = (galleries: Gallery[]) =>
    vi.spyOn(payload, 'find').mockImplementation(async ({ collection }) => {
        const docs = collection === 'galleries' ? galleries : [];
        return {
            docs,
            totalDocs: docs.length,
            totalPages: 1,
            limit: 0,
            page: 1,
            pagingCounter: 1,
            hasNextPage: false,
            hasPrevPage: false,
        };
    });

describe('festival maintenance endpoint', () => {
    it('rejects unauthorized requests and unknown modes before querying data', async () => {
        const find = mockRecords([]);
        expect((await festivalURLMaintenance.handler(await makeRequest('dry-run', false))).status).toBe(401);
        expect((await festivalURLMaintenance.handler(await makeRequest('invalid'))).status).toBe(400);
        expect(find).not.toHaveBeenCalled();
    });

    it('does not mutate records during dry-run or failed preflight', async () => {
        mockRecords([gallery]);
        const create = vi.spyOn(payload, 'create');
        const update = vi.spyOn(payload, 'update');
        const response = await festivalURLMaintenance.handler(await makeRequest('dry-run'));
        expect(response.status).toBe(200);
        expect(await response.json()).toMatchObject({ applied: false, inspectedGalleries: 1, festivalGalleries: 1 });
        mockRecords([{ ...gallery, location: null }]);
        expect((await festivalURLMaintenance.handler(await makeRequest('apply'))).status).toBe(409);
        expect(create).not.toHaveBeenCalled();
        expect(update).not.toHaveBeenCalled();
    });

    it('saves redirects before changing URLs and forwards request context for normal cache hooks', async () => {
        mockRecords([gallery]);
        const create = vi.spyOn(payload, 'create').mockResolvedValue({ id: 'redirect', createdAt: '', updatedAt: '' });
        const update = vi.spyOn(payload, 'update').mockResolvedValue(gallery);
        const req = await makeRequest('apply');
        const response = await festivalURLMaintenance.handler(req);
        expect(response.status).toBe(200);
        expect(await response.json()).toMatchObject({ applied: true, errors: [] });
        expect(create).toHaveBeenCalledTimes(2);
        expect(update).toHaveBeenCalledTimes(2);
        expect(create.mock.invocationCallOrder[1]).toBeLessThan(update.mock.invocationCallOrder[0] ?? 0);
        expect(create).toHaveBeenCalledWith(
            expect.objectContaining({
                collection: 'redirects',
                data: expect.objectContaining({ active: true, redirectType: '308' }),
            }),
        );
        expect(update).toHaveBeenCalledWith(
            expect.objectContaining({
                collection: 'galleries',
                locale: 'en',
                data: { slug: 'neckbreakker-copenhell-2026', slugLock: false, datePrecision: 'year', year: 2026 },
                req: expect.objectContaining({ context: req.context, locale: 'en' }),
            }),
        );
    });
});
