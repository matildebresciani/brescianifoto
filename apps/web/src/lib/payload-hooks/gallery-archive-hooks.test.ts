import { mongooseAdapter } from '@payloadcms/db-mongodb';
import payload, { buildConfig, createLocalReq } from 'payload';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { createAfterChangeRevalidateHook, createAfterDeleteRevalidateHook } from './revalidate-content';
import { createGalleryArchiveValidationHook } from './validate-gallery-archive';

const mocks = vi.hoisted(() => ({ revalidateEntry: vi.fn() }));
vi.mock('@/lib/utilities/entry-revalidation', () => mocks);

beforeAll(async () => {
    // Sanitizing a config builds real request/collection fixtures without connecting to MongoDB.
    payload.config = await buildConfig({
        secret: 'archive-hook-unit-test',
        db: mongooseAdapter({ url: 'mongodb://127.0.0.1:27017/archive-hook-unit-test' }),
        localization: { locales: ['da', 'en'], defaultLocale: 'da' },
        collections: [
            { slug: 'tags', fields: [{ name: 'slug', type: 'text', localized: true }] },
            { slug: 'tag-groups', fields: [{ name: 'name', type: 'text' }] },
            { slug: 'navigation', fields: [{ name: 'title', type: 'text' }] },
        ],
    });
});

const getCollection = (slug: 'tags' | 'tag-groups' | 'navigation') => {
    const collection = payload.config.collections.find((entry) => entry.slug === slug);
    if (!collection) throw new Error('Missing test collection');
    return collection;
};

describe('gallery archive Payload hooks', () => {
    it('preserves the save locale while passing transaction context into all-locale reads', async () => {
        const req = await createLocalReq({ locale: 'en', context: { testTransaction: true } }, payload);
        req.transactionID = 'archive-transaction';
        const find = vi.spyOn(payload, 'find').mockImplementation(async (options) => {
            // Payload's Local API sets locale on the supplied request during a find operation.
            if (options.req) options.req.locale = 'all';
            return {
                docs: [],
                totalDocs: 0,
                totalPages: 1,
                limit: 0,
                page: 1,
                pagingCounter: 1,
                hasNextPage: false,
                hasPrevPage: false,
            };
        });
        const data = { slug: 'band' };
        const result = await createGalleryArchiveValidationHook('tags')({
            collection: getCollection('tags'),
            context: req.context,
            operation: 'create',
            data,
            req,
        });
        expect(result).toEqual(data);
        expect(req.locale).toBe('en');
        expect(find).toHaveBeenCalledTimes(2);
        for (const [options] of find.mock.calls) {
            expect(options.req).not.toBe(req);
            expect(options.req?.transactionID).toBe('archive-transaction');
            expect(options.req?.context).toBe(req.context);
        }
    });

    it.each(['tags', 'tag-groups'] as const)('invalidates %s edits even without a publish status', async (slug) => {
        const req = await createLocalReq({ locale: 'da' }, payload);
        const doc = { id: 'archive', slug: 'festivals', hasArchivePage: false };
        await createAfterChangeRevalidateHook(slug)({
            collection: getCollection(slug),
            context: req.context,
            operation: 'update',
            data: doc,
            doc,
            previousDoc: { ...doc, hasArchivePage: true },
            req,
        });
        expect(mocks.revalidateEntry).toHaveBeenCalledWith(doc, slug);
    });

    it('invalidates a deleted group', async () => {
        const req = await createLocalReq({ locale: 'da' }, payload);
        const doc = { id: 'archive', slug: 'festivals' };
        await createAfterDeleteRevalidateHook('tag-groups')({
            collection: getCollection('tag-groups'),
            context: req.context,
            doc,
            id: doc.id,
            req,
        });
        expect(mocks.revalidateEntry).toHaveBeenCalledWith(doc, 'tag-groups');
    });

    it.each([
        'create',
        'update',
    ] as const)('invalidates navigation on %s without a publish status', async (operation) => {
        const req = await createLocalReq({ locale: 'da' }, payload);
        const doc = { id: 'main-menu', title: 'Main navigation', position: { main: true, mobile: true } };
        await createAfterChangeRevalidateHook('navigation')({
            collection: getCollection('navigation'),
            context: req.context,
            operation,
            data: doc,
            doc,
            previousDoc: operation === 'update' ? { ...doc, position: { main: true, mobile: false } } : {},
            req,
        });
        expect(mocks.revalidateEntry).toHaveBeenCalledWith(doc, 'navigation');
    });

    it('respects disabled revalidation during maintenance operations', async () => {
        const req = await createLocalReq({ locale: 'da', context: { disableRevalidate: true } }, payload);
        const doc = { id: 'archive', slug: 'festivals' };
        await createAfterChangeRevalidateHook('tag-groups')({
            collection: getCollection('tag-groups'),
            context: req.context,
            operation: 'update',
            data: doc,
            doc,
            previousDoc: doc,
            req,
        });
        expect(mocks.revalidateEntry).not.toHaveBeenCalled();
    });
});
