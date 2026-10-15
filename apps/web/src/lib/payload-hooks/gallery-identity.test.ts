import { mongooseAdapter } from '@payloadcms/db-mongodb';
import payload, { buildConfig, createLocalReq, ValidationError } from 'payload';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { slugField } from '@/components/molecules/admin/fields/slug';
import { formatGalleryIdentity } from '@/lib/utilities/gallery-identity';
import type { Gallery } from '@/payload-types';
import { prepareGalleryIdentity, validateGalleryDate, validateGallerySlug } from './gallery-identity';

beforeAll(async () => {
    payload.config = await buildConfig({
        secret: 'gallery-identity-unit-test',
        db: mongooseAdapter({ url: 'mongodb://127.0.0.1:27017/gallery-identity-unit-test' }),
        localization: { locales: ['da', 'en'], defaultLocale: 'da' },
        collections: [
            { slug: 'galleries', fields: [{ name: 'slug', type: 'text', localized: true }] },
            { slug: 'locations', fields: [{ name: 'name', type: 'text' }] },
        ],
    });
});

const original: Gallery = {
    id: 'show',
    name: 'Fontaines D.C. · VEGA · 2026-10-14',
    title: 'Fontaines D.C.',
    date: '2026-10-14T12:00:00Z',
    location: 'vega',
    slug: 'fontaines-dc-vega-2026-10-14',
    slugLock: true,
    publishStatus: 'draft',
    gallery: [],
    createdAt: '',
    updatedAt: '',
};

const hookArgs = async (data: Partial<Gallery>, originalDoc?: Gallery, locale: 'da' | 'en' = 'da') => {
    const req = await createLocalReq({ locale, context: { identityTest: true } }, payload);
    req.transactionID = 'gallery-transaction';
    const collection = payload.config.collections.find((entry) => entry.slug === 'galleries');
    if (!collection) throw new Error('Missing test collection');
    return {
        data,
        originalDoc,
        collection,
        req,
        context: req.context,
        operation: originalDoc ? 'update' : 'create',
    } satisfies Parameters<typeof prepareGalleryIdentity>[0];
};

const mockGalleries = (docs: { id: string; slug?: Record<string, string | null> | string }[]) =>
    vi.spyOn(payload, 'find').mockImplementation(async (options) => {
        if (options.req) options.req.locale = 'all';
        return {
            docs: docs.map((doc) => ({ name: 'Test gallery', createdAt: '', updatedAt: '', ...doc })),
            totalDocs: docs.length,
            totalPages: 1,
            limit: 0,
            page: 1,
            pagingCounter: 1,
            hasNextPage: false,
            hasPrevPage: false,
        };
    });

describe('gallery show identity', () => {
    it('generates readable slugs and admin names, preserving the artist title', async () => {
        const findByID = vi.spyOn(payload, 'findByID').mockResolvedValue({
            id: 'vega',
            name: 'VEGA',
            createdAt: '',
            updatedAt: '',
        });
        const args = await hookArgs({ title: original.title, location: 'vega', date: original.date });
        expect(await prepareGalleryIdentity(args)).toMatchObject({
            title: 'Fontaines D.C.',
            name: 'Fontaines D.C. · VEGA · 2026-10-14',
            slug: 'fontaines-dc-vega-2026-10-14',
        });
        expect(findByID.mock.calls[0]?.[0].req?.transactionID).toBe('gallery-transaction');
    });

    it('distinguishes the same artist by venue and date and uses the Copenhagen calendar date', () => {
        const venue = { id: 'vega', name: 'VEGA', createdAt: '', updatedAt: '' };
        expect(formatGalleryIdentity({ ...original, location: venue, date: '2026-10-13T23:30:00Z' }).slug).toBe(
            original.slug,
        );
        expect(formatGalleryIdentity({ ...original, location: { ...venue, name: 'Royal Arena' } }).slug).not.toBe(
            original.slug,
        );
        expect(formatGalleryIdentity({ ...original, location: venue, date: '2026-10-15' }).slug).not.toBe(
            original.slug,
        );
        expect(formatGalleryIdentity({ ...original, location: null, date: 'invalid' }).slug).toBe('fontaines-dc');
    });

    it('updates automatic draft slugs using unchanged fields from the existing gallery', async () => {
        vi.spyOn(payload, 'findByID').mockResolvedValue({ id: 'vega', name: 'VEGA', createdAt: '', updatedAt: '' });
        const args = await hookArgs({ date: '2026-10-15', name: 'My custom admin name' }, original);
        expect(await prepareGalleryIdentity(args)).toMatchObject({
            slug: 'fontaines-dc-vega-2026-10-15',
            name: 'My custom admin name',
        });
    });

    it('generates the final URL and switches to manual mode when publishing', async () => {
        vi.spyOn(payload, 'findByID').mockResolvedValue({ id: 'vega', name: 'VEGA', createdAt: '', updatedAt: '' });
        const args = await hookArgs({ date: '2026-10-15', publishStatus: 'public' }, original);
        expect(await prepareGalleryIdentity(args)).toMatchObject({
            slug: 'fontaines-dc-vega-2026-10-15',
            slugLock: false,
        });
    });

    it('preserves legacy public URLs even when title, venue, date and the submitted slug change', async () => {
        const findByID = vi.spyOn(payload, 'findByID');
        const args = await hookArgs(
            { title: 'Edited title', location: null, date: '2026-10-15', slug: 'edited-title', slugLock: true },
            { ...original, slug: 'legacy-url', publishStatus: 'public' },
        );
        expect(await prepareGalleryIdentity(args)).toMatchObject({ slug: 'legacy-url', slugLock: false });
        expect(findByID).not.toHaveBeenCalled();
    });

    it('keeps URLs stable after returning a published gallery to draft', async () => {
        const args = await hookArgs(
            { title: 'Edited title', publishStatus: 'draft' },
            { ...original, slugLock: false },
        );
        expect(await prepareGalleryIdentity(args)).not.toHaveProperty('slug');
    });

    it('accepts normalized custom slugs when explicitly unlocked', async () => {
        const args = await hookArgs(
            { slugLock: false, slug: 'My Custom Show' },
            { ...original, publishStatus: 'public' },
        );
        expect(await prepareGalleryIdentity(args)).toMatchObject({ slug: 'my-custom-show', slugLock: false });
    });

    it('does not populate gallery slugs from the title-only field hook', async () => {
        const [field] = slugField('title', { shouldGenerateFromTitle: false });
        const hook = field.hooks?.beforeValidate?.[0];
        const args = await hookArgs({ title: original.title });
        expect(
            hook?.({
                ...args,
                field,
                blockData: undefined,
                global: null,
                indexPath: [0],
                path: ['slug'],
                schemaPath: ['slug'],
                siblingData: args.data,
                siblingFields: [field],
                value: undefined,
            }),
        ).toBeUndefined();
    });
});

describe('gallery date precision', () => {
    it.each([null, undefined, 26, 2026.5, 10000])('rejects an invalid year-only year: %s', async (year) => {
        const args = await hookArgs({ datePrecision: 'year', year });
        expect(() => validateGalleryDate(args)).toThrow(ValidationError);
    });

    it('validates the effective year on partial updates without requiring a hidden exact date', async () => {
        const args = await hookArgs({ year: 2027 }, { ...original, datePrecision: 'year', year: 2026 });
        expect(validateGalleryDate(args)).toEqual({ year: 2027 });
        expect(validateGalleryDate(await hookArgs({ datePrecision: 'day' }))).toEqual({ datePrecision: 'day' });
    });

    it('resolves festival relationship IDs and generates artist-location-year on partial draft saves', async () => {
        const festival = { id: 'festivals', name: 'Festivals', slug: 'festivals', createdAt: '', updatedAt: '' };
        const location = { id: 'copenhell', name: 'Copenhell', createdAt: '', updatedAt: '' };
        vi.spyOn(payload, 'findByID').mockImplementation(async ({ collection }) =>
            collection === 'locations' ? location : festival,
        );
        const args = await hookArgs(
            { year: 2026 },
            {
                ...original,
                name: '',
                title: 'Neckbreakker',
                tagGroup: 'festivals',
                location: 'copenhell',
                datePrecision: 'year',
                year: 2025,
            },
        );
        expect(await prepareGalleryIdentity(args)).toMatchObject({
            slug: 'neckbreakker-copenhell-2026',
            name: 'Neckbreakker · Copenhell · 2026',
        });
    });

    it('uses only the edition year for festivals with an exact show date', async () => {
        const args = await hookArgs({
            title: 'Neckbreakker',
            date: '2026-06-20',
            tagGroup: { id: 'festivals', name: 'Festivals', createdAt: '', updatedAt: '' },
            location: { id: 'copenhell', name: 'Copenhell 2026', createdAt: '', updatedAt: '' },
        });
        expect(await prepareGalleryIdentity(args)).toMatchObject({ slug: 'neckbreakker-copenhell-2026' });
    });
});

describe('gallery slug uniqueness', () => {
    it('rejects an empty custom slug', async () => {
        const args = await hookArgs({ slug: '', slugLock: false });
        await expect(validateGallerySlug(args)).rejects.toBeInstanceOf(ValidationError);
    });
    it('rejects duplicate URLs in the same locale', async () => {
        mockGalleries([{ id: 'other', slug: { da: original.slug ?? '' } }]);
        const args = await hookArgs({ slug: original.slug });
        await expect(validateGallerySlug(args)).rejects.toBeInstanceOf(ValidationError);
    });

    it('does not exclude the source gallery when duplicating it', async () => {
        mockGalleries([{ id: original.id, slug: { da: original.slug ?? '' } }]);
        const args = await hookArgs({ slug: original.slug }, original);
        await expect(validateGallerySlug({ ...args, operation: 'create' })).rejects.toBeInstanceOf(ValidationError);
    });

    it('checks English fallback URLs when editing the default-language slug', async () => {
        mockGalleries([
            { id: original.id, slug: { da: 'old-slug' } },
            { id: 'other', slug: { da: 'different-slug', en: 'shared-slug' } },
        ]);
        const args = await hookArgs({ slug: 'shared-slug' }, original);
        await expect(validateGallerySlug(args)).rejects.toMatchObject({
            data: { errors: [expect.objectContaining({ path: 'slug', message: expect.stringContaining('in en') })] },
        });
    });

    it('allows self edits and distinct translated URLs, retaining the request locale and transaction', async () => {
        const find = mockGalleries([
            { id: original.id, slug: { da: 'original-slug', en: 'english-slug' } },
            { id: 'other', slug: { da: 'english-slug', en: 'other-english-slug' } },
        ]);
        const args = await hookArgs({ slug: 'english-slug' }, original, 'en');
        expect(await validateGallerySlug(args)).toEqual(args.data);
        expect(args.req.locale).toBe('en');
        expect(find.mock.calls[0]?.[0].req?.transactionID).toBe('gallery-transaction');
        expect(find.mock.calls[0]?.[0].req?.context).toBe(args.req.context);
    });

    it('rejects collisions inherited from an untranslated gallery', async () => {
        mockGalleries([{ id: 'other', slug: { da: 'shared-slug' } }]);
        const args = await hookArgs({ slug: 'shared-slug' }, undefined, 'en');
        await expect(validateGallerySlug(args)).rejects.toBeInstanceOf(ValidationError);
    });

    it('allows existing galleries without slugs to remain unchanged', async () => {
        mockGalleries([{ id: original.id }]);
        const args = await hookArgs({}, original);
        expect(await validateGallerySlug(args)).toEqual({});
    });
});
