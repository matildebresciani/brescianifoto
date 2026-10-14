import type { ReactNode } from 'react';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Locale } from '@/i18n/localized-collections';
import { getGalleryArchive } from '@/lib/data/payload/get-gallery-archive';
import GalleryArchivePage, { generateMetadata } from './page';

const mocks = vi.hoisted(() => ({
    getCachedCollection: vi.fn(),
    getTranslations: vi.fn(),
}));

vi.mock('@/lib/data/payload/get-cached-collection', () => ({ getCachedCollection: mocks.getCachedCollection }));
vi.mock('next/navigation', () => ({
    notFound: () => {
        throw new Error('NEXT_NOT_FOUND');
    },
}));
vi.mock('next-intl/server', () => ({
    setRequestLocale: vi.fn(),
    getTranslations: mocks.getTranslations,
}));
vi.mock('@/components/molecules/frontend/GalleryCard', () => ({
    default: ({ data }: { data: { title: string } }) => React.createElement('span', null, data.title),
}));
vi.mock('@/components/organisms/blocks/base-block/BaseBlock', () => ({
    default: ({ children }: { children: ReactNode }) => React.createElement('section', null, children),
}));

const groups = [
    { id: 'concerts', slug: 'concerts', title: 'Concerts', hasArchivePage: true },
    { id: 'festivals', slug: 'festivals', title: 'Festivals', hasArchivePage: true },
    { id: 'artists', slug: 'artists', title: 'Artists', hasArchivePage: false },
    { id: 'empty', slug: 'empty', title: 'An empty section', hasArchivePage: true },
];
const tags = [
    { id: 'band', slug: 'band', tag: 'The band', name: 'Band' },
    { id: 'copenhell', slug: 'copenhell', tag: 'Copenhell', name: 'Copenhell' },
    { id: 'legacy-concerts', slug: 'concerts', tag: 'Legacy concerts tag', name: 'Concerts' },
    { id: 'artists-tag', slug: 'artists', tag: 'Artist tag', name: 'Artist tag' },
];
const galleries = [
    { title: 'Standalone show', id: 'show', tagGroup: 'concerts', tags: ['band'], publishStatus: 'public' },
    {
        title: 'Festival show',
        id: 'festival',
        tagGroup: 'festivals',
        tags: ['band', 'copenhell'],
        publishStatus: 'public',
    },
    { title: 'Unlisted show', id: 'private', tagGroup: 'concerts', tags: ['band'], publishStatus: 'private' },
    { title: 'Ungrouped show', id: 'ungrouped', tags: ['copenhell'], publishStatus: 'public' },
];

beforeEach(() => {
    vi.stubGlobal('React', React);
    mocks.getTranslations.mockResolvedValue(() => 'No galleries yet.');
    mocks.getCachedCollection.mockImplementation(
        ({
            collection,
            whereFields,
        }: {
            collection: string;
            whereFields?: { tagGroup?: { equals: string }; tags?: { equals: string } };
        }) => {
            if (collection === 'tag-groups') return Promise.resolve({ docs: groups });
            if (collection === 'tags') return Promise.resolve({ docs: tags });
            const docs = galleries.filter(
                (gallery) =>
                    gallery.publishStatus === 'public' &&
                    (!whereFields?.tagGroup || gallery.tagGroup === whereFields.tagGroup.equals) &&
                    (!whereFields?.tags || gallery.tags.includes(whereFields.tags.equals)),
            );
            return Promise.resolve({ docs });
        },
    );
});

afterEach(() => vi.unstubAllGlobals());

const params = (tag: string, locale: Locale = 'da') => Promise.resolve({ tag, locale });

describe('shared gallery archive pages', () => {
    it('resolves enabled groups before a legacy tag with the same slug', async () => {
        const archive = await getGalleryArchive('concerts', 'da');
        expect(archive).toMatchObject({
            kind: 'group',
            title: 'Concerts',
            galleryWhere: { tagGroup: { equals: 'concerts' } },
        });
        expect(mocks.getCachedCollection).toHaveBeenCalledTimes(1);
    });

    it('keeps standalone concerts separate from festival performances', async () => {
        const html = renderToStaticMarkup(await GalleryArchivePage({ params: params('concerts') }));
        expect(html).toContain('Standalone show');
        expect(html).not.toContain('Festival show');
        expect(html).not.toContain('Unlisted show');
        expect(html).not.toContain('Ungrouped show');
        expect(mocks.getCachedCollection).toHaveBeenLastCalledWith(
            expect.objectContaining({ collection: 'galleries', limit: 100, sort: '-date', depth: 1 }),
        );
    });

    it('shows only festival galleries on the Festivals group page', async () => {
        const html = renderToStaticMarkup(await GalleryArchivePage({ params: params('festivals') }));
        expect(html).toContain('Festival show');
        expect(html).not.toContain('Standalone show');
    });

    it('shows an artist across concert and festival groups without private galleries', async () => {
        const html = renderToStaticMarkup(await GalleryArchivePage({ params: params('band', 'en') }));
        expect(html).toContain('The band');
        expect(html).toContain('Standalone show');
        expect(html).toContain('Festival show');
        expect(html).not.toContain('Unlisted show');
    });

    it('preserves tag pages for galleries without a main group', async () => {
        const html = renderToStaticMarkup(await GalleryArchivePage({ params: params('copenhell') }));
        expect(html).toContain('Festival show');
        expect(html).toContain('Ungrouped show');
    });

    it('falls back to a tag when the matching group is disabled', async () => {
        expect(await getGalleryArchive('artists', 'da')).toMatchObject({ kind: 'tag', title: 'Artist tag' });
    });

    it('returns 404 for unknown archives and disabled groups without a matching tag', async () => {
        await expect(GalleryArchivePage({ params: params('missing') })).rejects.toThrow('NEXT_NOT_FOUND');
        mocks.getCachedCollection.mockResolvedValueOnce({ docs: [groups[2]] }).mockResolvedValueOnce({ docs: [] });
        await expect(GalleryArchivePage({ params: params('artists') })).rejects.toThrow('NEXT_NOT_FOUND');
    });

    it('renders the empty-state translation using the requested locale', async () => {
        mocks.getTranslations.mockResolvedValue(() => 'Der er ingen gallerier endnu.');
        const html = renderToStaticMarkup(await GalleryArchivePage({ params: params('empty') }));
        expect(html).toContain('Der er ingen gallerier endnu.');
        expect(mocks.getTranslations).toHaveBeenCalledWith({ locale: 'da', namespace: 'galleryArchive' });
    });

    it('generates localized canonical URLs without a groups segment', async () => {
        expect(await generateMetadata({ params: params('concerts') })).toMatchObject({
            title: 'Concerts',
            alternates: { canonical: '/galleries/concerts' },
        });
        expect(await generateMetadata({ params: params('band', 'en') })).toMatchObject({
            title: 'The band',
            alternates: { canonical: '/en/galleries/band' },
        });
    });
});
