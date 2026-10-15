import { describe, expect, it } from 'vitest';
import { resolveFestivalIdentity } from './festival-gallery';
import { formatGalleryIdentity } from './gallery-identity';
import { formatGalleryCardCaption, formatGalleryMetadata, formatPresentationDate } from './gallery-metadata';

describe('gallery presentation metadata', () => {
    it('formats English dates, venue and counts in the same order', () => {
        expect(
            formatGalleryMetadata({
                location: { id: 'venue', name: 'Royal Arena', city: 'Copenhagen', createdAt: '', updatedAt: '' },
                date: '2026-04-26T12:00:00Z',
                gallery: ['one', 'two'],
            }),
        ).toBe('Royal Arena, Copenhagen / 26 Apr 2026 / 2 images');
    });
    it('omits unresolved venues and invalid dates, retaining singular counts', () => {
        expect(formatGalleryMetadata({ location: 'unpopulated', date: '2026-02-30', gallery: ['one'] })).toBe(
            '1 image',
        );
        expect(formatGalleryMetadata({ location: null, date: null, gallery: [] })).toBe('0 images');
        expect(formatPresentationDate('not a date')).toBeUndefined();
        expect(formatPresentationDate(undefined)).toBeUndefined();
    });
    it('uses the Copenhagen calendar date at a UTC day boundary', () => {
        expect(formatPresentationDate('2026-04-25T23:30:00Z')).toBe('26 Apr 2026');
    });
});

const festivalGroup = { id: 'festivals', name: 'Festivals', slug: 'festivals', createdAt: '', updatedAt: '' };
const festivalTag = {
    id: 'copenhell',
    name: 'Copenhell',
    tag: 'Copenhell',
    tagGroup: festivalGroup,
    createdAt: '',
    updatedAt: '',
};
const location = { id: 'copenhell-location', name: 'Copenhell', createdAt: '', updatedAt: '' };

describe('compact gallery card captions', () => {
    it('distinguishes repeated artist shows with the venue and date', () => {
        expect(
            formatGalleryCardCaption({
                title: 'Fontaines D.C.',
                location: { id: 'vega', name: 'VEGA', createdAt: '', updatedAt: '' },
                date: '2026-10-14',
            }),
        ).toBe('Fontaines D.C. / VEGA / 14 Oct 2026');
    });
    it('uses artist and English date for a concert, preserving content case for CSS', () => {
        expect(formatGalleryCardCaption({ title: '5 seconds of summer', date: '2026-04-26T12:00:00Z' })).toBe(
            '5 seconds of summer / 26 Apr 2026',
        );
    });
    it('uses location exclusively and separates the festival and year', () => {
        expect(
            formatGalleryCardCaption({
                title: 'Neckbreakker',
                date: '2026-06-26',
                location,
                tags: [{ ...festivalTag, tag: 'A different festival 2025' }],
            }),
        ).toBe('Neckbreakker / Copenhell / 2026');
    });
    it('uses a known festival venue when a festival gallery has no festival tag', () => {
        expect(
            formatGalleryCardCaption({
                title: 'Neckbreakker',
                tagGroup: festivalGroup,
                date: '2026-06-26',
                location: { id: 'venue', name: 'Copenhell', city: '', createdAt: '', updatedAt: '' },
            }),
        ).toBe('Neckbreakker / Copenhell / 2026');
    });
    it('honors the main concert group even if there is a cross-section festival tag', () => {
        expect(
            formatGalleryCardCaption({
                title: 'Artist',
                tagGroup: { ...festivalGroup, name: 'Concerts', slug: 'concerts' },
                tags: [festivalTag],
                date: '2026-04-26',
            }),
        ).toBe('Artist / 26 Apr 2026');
    });
    it('omits invalid dates and recovers a year from location without a date', () => {
        expect(formatGalleryCardCaption({ title: 'Artist', date: '2026-02-30' })).toBe('Artist');
        expect(
            formatGalleryCardCaption({
                title: 'Neckbreakker',
                date: 'invalid',
                location: { ...location, name: 'Copenhell 2026' },
                tags: [{ ...festivalTag, tag: 'Copenhell 2026' }],
            }),
        ).toBe('Neckbreakker / Copenhell / 2026');
        expect(
            formatGalleryCardCaption({ title: 'Artist', tagGroup: festivalGroup, tags: ['unresolved'], date: null }),
        ).toBe('Artist');
    });

    it('does not invent a festival name or year from tags when location is missing', () => {
        expect(formatGalleryCardCaption({ title: 'Artist', tags: [{ ...festivalTag, tag: 'Copenhell 2026' }] })).toBe(
            'Artist',
        );
    });

    it.each([
        'Copenhell',
        'Copenhell 2026',
        '  copenhell 2026  ',
    ])('shows overview %s without a repeated festival name', (title) => {
        const gallery = { title, location, tagGroup: festivalGroup, datePrecision: 'year' as const, year: 2026 };
        expect(formatGalleryCardCaption(gallery)).toBe('Copenhell 2026');
        expect(formatGalleryIdentity(gallery).slug).toBe('copenhell-2026');
    });

    it('can recover an overview year from the title, but never an artist name ending in a year', () => {
        expect(formatGalleryIdentity({ title: 'Copenhell 2026', location, tagGroup: festivalGroup }).slug).toBe(
            'copenhell-2026',
        );
        expect(formatGalleryCardCaption({ title: 'The 1975', location, tagGroup: festivalGroup })).toBe(
            'The 1975 / Copenhell',
        );
    });

    it('uses a year-only choice instead of a retained exact date for metadata and URLs', () => {
        const gallery = {
            title: 'Neckbreakker',
            location,
            tagGroup: festivalGroup,
            datePrecision: 'year' as const,
            year: 2026,
            date: '2025-06-20',
            gallery: ['one'],
        };
        expect(formatGalleryCardCaption(gallery)).toBe('Neckbreakker / Copenhell / 2026');
        expect(formatGalleryIdentity(gallery).slug).toBe('neckbreakker-copenhell-2026');
        expect(formatGalleryMetadata(gallery)).toBe('Copenhell / 2026 / 1 image');
    });

    it('separates location years once and reports conflicting legacy sources', () => {
        const gallery = {
            title: 'Artist',
            location: { ...location, name: 'Copenhell 2025' },
            tagGroup: festivalGroup,
            date: '2026-06-20',
        };
        expect(resolveFestivalIdentity(gallery)).toMatchObject({ year: 2026, hasYearConflict: true });
        expect(formatGalleryCardCaption(gallery)).toBe('Artist / Copenhell / 2026');
        expect(resolveFestivalIdentity({ ...gallery, date: null, title: 'Copenhell 2026' })).toMatchObject({
            year: undefined,
            hasYearConflict: true,
        });
    });
});
