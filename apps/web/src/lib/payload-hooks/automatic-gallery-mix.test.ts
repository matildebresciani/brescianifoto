import { mongooseAdapter } from '@payloadcms/db-mongodb';
import payload, { buildConfig, createLocalReq } from 'payload';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { imageMock } from '@/__mocks__/storybook-mocks';
import type { Gallery, Option } from '@/payload-types';
import { refreshAutomaticGalleryMix, syncAutomaticGalleryMix } from './automatic-gallery-mix';

beforeAll(async () => {
    payload.config = await buildConfig({
        secret: 'mix-unit-test',
        db: mongooseAdapter({ url: 'mongodb://127.0.0.1:27017/mix-unit-test' }),
        localization: { locales: ['da', 'en'], defaultLocale: 'da' },
        collections: [
            { slug: 'galleries', fields: [] },
            { slug: 'media', fields: [] },
        ],
        globals: [{ slug: 'options', fields: [] }],
    });
});
const gallery = (id: string): Gallery => ({
    id,
    title: id,
    gallery: [{ ...imageMock, id: `photo-${id}` }],
    publishStatus: 'public',
    createdAt: '',
    updatedAt: '',
});
const option = (consideredGalleryIds: string[] = []): Option => ({
    id: 'options',
    automaticGalleryMix: { isInitialized: true, consideredGalleryIds, photos: ['photo-a'] },
});
const result = (docs: Gallery[]) => ({
    docs,
    totalDocs: docs.length,
    totalPages: 1,
    limit: 0,
    page: 1,
    pagingCounter: 1,
    hasNextPage: false,
    hasPrevPage: false,
});

beforeEach(() => {
    vi.spyOn(payload, 'findGlobal').mockResolvedValue(option(['a']));
    vi.spyOn(payload, 'find').mockResolvedValue(result([gallery('a')]));
    vi.spyOn(payload, 'updateGlobal').mockResolvedValue(option(['a']));
});

describe('persisted gallery mix', () => {
    it('refreshes every affected locale without changing the publishing request locale', async () => {
        vi.mocked(payload.find).mockResolvedValue(result([gallery('a'), gallery('new')]));
        const req = await createLocalReq({ locale: 'da' }, payload);
        const collection = payload.config.collections.find((item) => item.slug === 'galleries');
        if (!collection) throw new Error('Missing gallery test collection');
        const doc = gallery('new');
        await refreshAutomaticGalleryMix({
            collection,
            req,
            context: req.context,
            doc,
            data: doc,
            previousDoc: {},
            operation: 'create',
        });
        expect(payload.updateGlobal).toHaveBeenCalledTimes(2);
        expect(payload.updateGlobal).toHaveBeenCalledWith(expect.objectContaining({ locale: 'da' }));
        expect(payload.updateGlobal).toHaveBeenCalledWith(expect.objectContaining({ locale: 'en' }));
        expect(req.locale).toBe('da');
    });
    it('ignores draft saves before any mix read or write', async () => {
        const req = await createLocalReq({ locale: 'da' }, payload);
        const collection = payload.config.collections.find((item) => item.slug === 'galleries');
        if (!collection) throw new Error('Missing gallery test collection');
        const doc = { ...gallery('new'), publishStatus: 'draft' };
        await refreshAutomaticGalleryMix({
            collection,
            req,
            context: req.context,
            doc,
            data: doc,
            previousDoc: {},
            operation: 'create',
        });
        expect(payload.findGlobal).not.toHaveBeenCalled();
        expect(payload.updateGlobal).not.toHaveBeenCalled();
    });
    it('keeps the snapshot on edits, repeat setup, reloads and republishing known galleries', async () => {
        await syncAutomaticGalleryMix(payload, 'da');
        await syncAutomaticGalleryMix(payload, 'da');
        expect(payload.updateGlobal).not.toHaveBeenCalled();
    });
    it('initializes an empty pool exactly once', async () => {
        vi.mocked(payload.findGlobal).mockResolvedValueOnce({ id: 'options' });
        vi.mocked(payload.find).mockResolvedValue(result([]));
        await syncAutomaticGalleryMix(payload, 'da');
        expect(payload.updateGlobal).toHaveBeenCalledWith(
            expect.objectContaining({
                data: { automaticGalleryMix: { isInitialized: true, consideredGalleryIds: [], photos: [] } },
            }),
        );
    });
    it('regenerates for a newly public ID and retains IDs of previously unpublished galleries', async () => {
        vi.mocked(payload.findGlobal).mockResolvedValue(option(['a', 'unpublished']));
        vi.mocked(payload.find).mockResolvedValue(result([gallery('a'), gallery('new')]));
        const req = await createLocalReq({ locale: 'en', context: { example: true } }, payload);
        req.transactionID = 'transaction';
        await syncAutomaticGalleryMix(payload, 'en', req);
        expect(payload.updateGlobal).toHaveBeenCalledWith(
            expect.objectContaining({
                locale: 'en',
                req,
                data: {
                    automaticGalleryMix: {
                        isInitialized: true,
                        consideredGalleryIds: ['a', 'unpublished', 'new'],
                        photos: expect.arrayContaining(['photo-a', 'photo-new']),
                    },
                },
            }),
        );
        expect(payload.find).toHaveBeenCalledWith(
            expect.objectContaining({
                draft: false,
                overrideAccess: false,
                where: { publishStatus: { equals: 'public' } },
            }),
        );
    });
});
