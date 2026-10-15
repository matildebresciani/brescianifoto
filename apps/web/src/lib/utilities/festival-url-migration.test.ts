import { describe, expect, it } from 'vitest';
import type { Gallery, Redirect } from '@/payload-types';
import { planFestivalURLMigration } from './festival-url-migration';

const festivalGroup = { id: 'festivals', name: 'Festivals', slug: 'festivals', createdAt: '', updatedAt: '' };
const gallery: Gallery = {
    id: 'artist',
    title: 'Neckbreakker',
    slug: 'neckbreakker-copenhell',
    location: { id: 'copenhell', name: 'Copenhell 2026', createdAt: '', updatedAt: '' },
    tagGroup: festivalGroup,
    publishStatus: 'public',
    gallery: [],
    createdAt: '',
    updatedAt: '',
};
const origin = 'https://brescianifoto.example';
const redirect: Redirect = {
    id: 'redirect',
    redirectFrom: '/gallery/neckbreakker-copenhell',
    redirectTo: `${origin}/gallery/neckbreakker-copenhell-2026`,
    redirectType: '308',
    active: true,
    createdAt: '',
    updatedAt: '',
};

describe('festival URL migration preflight', () => {
    it('recovers year-only dates and redirects both real and inherited locale URLs', () => {
        const plan = planFestivalURLMigration(
            [
                { locale: 'da', galleries: [gallery] },
                { locale: 'en', galleries: [{ ...gallery, title: '', slug: null }] },
            ],
            [],
            origin,
        );
        expect(plan.errors).toEqual([]);
        expect(plan.changes).toEqual([
            {
                id: 'artist',
                locale: 'da',
                oldSlug: gallery.slug,
                slug: 'neckbreakker-copenhell-2026',
                recoveredYear: 2026,
            },
            {
                id: 'artist',
                locale: 'en',
                oldSlug: gallery.slug,
                slug: 'neckbreakker-copenhell-2026',
                recoveredYear: 2026,
            },
        ]);
        expect(plan.redirects).toEqual([
            { from: '/gallery/neckbreakker-copenhell', to: '/gallery/neckbreakker-copenhell-2026' },
            { from: '/en/gallery/neckbreakker-copenhell', to: '/en/gallery/neckbreakker-copenhell-2026' },
        ]);
    });

    it('is repeatable and reuses an existing redirect when retrying an interrupted change', () => {
        expect(
            planFestivalURLMigration([{ locale: 'da', galleries: [gallery] }], [redirect], origin).redirects[0]
                ?.existingId,
        ).toBe('redirect');
        const migrated = {
            ...gallery,
            slug: 'neckbreakker-copenhell-2026',
            datePrecision: 'year' as const,
            year: 2026,
        };
        expect(planFestivalURLMigration([{ locale: 'da', galleries: [migrated] }], [redirect], origin)).toEqual({
            changes: [],
            redirects: [],
            errors: [],
        });
    });

    it('deduplicates overview titles and preserves exact dates', () => {
        const overview = { ...gallery, title: 'Copenhell 2026', date: '2026-06-20', slug: 'copenhell-2026-copenhell' };
        expect(planFestivalURLMigration([{ locale: 'da', galleries: [overview] }], [], origin).changes).toEqual([
            { id: gallery.id, locale: 'da', oldSlug: overview.slug, slug: 'copenhell-2026', recoveredYear: undefined },
        ]);
    });

    it.each([
        [{ ...gallery, location: null }, 'missing location'],
        [
            { ...gallery, location: { id: 'copenhell', name: 'Copenhell', createdAt: '', updatedAt: '' } },
            'missing year',
        ],
        [{ ...gallery, date: '2025-06-20' }, 'conflicting years'],
    ] satisfies [Gallery, string][])('reports incomplete or conflicting entries without guessing', (entry, reason) => {
        const plan = planFestivalURLMigration([{ locale: 'da', galleries: [entry] }], [], origin);
        expect(plan.changes).toEqual([]);
        expect(plan.errors[0]).toContain(reason);
    });

    it('rejects current and proposed URL collisions across galleries', () => {
        const other = { ...gallery, id: 'other', slug: 'neckbreakker-copenhell-2026' };
        expect(
            planFestivalURLMigration([{ locale: 'da', galleries: [gallery, other] }], [], origin).errors[0],
        ).toContain('collision');
        expect(
            planFestivalURLMigration([{ locale: 'da', galleries: [gallery, { ...other, slug: 'other' }] }], [], origin)
                .errors[0],
        ).toContain('collision');
    });

    it('rejects conflicting redirects and cross-locale edition years', () => {
        expect(
            planFestivalURLMigration(
                [{ locale: 'da', galleries: [gallery] }],
                [{ ...redirect, redirectTo: 'https://elsewhere.example' }],
                origin,
            ).errors[0],
        ).toContain('conflicting redirect');
        const overview = {
            ...gallery,
            title: 'Copenhell 2026',
            location: { id: 'copenhell', name: 'Copenhell', createdAt: '', updatedAt: '' },
        };
        expect(
            planFestivalURLMigration(
                [
                    { locale: 'da', galleries: [overview] },
                    { locale: 'en', galleries: [{ ...overview, title: 'Copenhell 2025' }] },
                ],
                [],
                origin,
            ).errors[0],
        ).toContain('across locales');
    });

    it('leaves concerts untouched and does not redirect unpublished galleries', () => {
        const concert = {
            ...gallery,
            id: 'concert',
            tagGroup: { ...festivalGroup, slug: 'concerts', name: 'Concerts' },
        };
        const plan = planFestivalURLMigration(
            [{ locale: 'da', galleries: [concert, { ...gallery, publishStatus: 'draft' }] }],
            [],
            origin,
        );
        expect(plan.changes).toHaveLength(1);
        expect(plan.changes[0]?.id).toBe(gallery.id);
        expect(plan.redirects).toEqual([]);
    });
});
