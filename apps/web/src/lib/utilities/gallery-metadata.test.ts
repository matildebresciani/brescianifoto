import { describe, expect, it } from 'vitest';
import { formatGalleryCardCaption, formatGalleryMetadata, formatPresentationDate } from './gallery-metadata';

describe('gallery presentation metadata', () => {
    it('formats English dates, venue and counts in the same order', () => {
        expect(
            formatGalleryMetadata({
                location: { id: 'venue', name: 'Royal Arena', city: 'Copenhagen', createdAt: '', updatedAt: '' },
                date: '2026-04-26T12:00:00Z',
                gallery: ['one', 'two'],
            }),
        ).toBe('Royal Arena, Copenhagen · 26 Apr 2026 · 2 images');
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

describe('compact gallery card captions', () => {
    it('uses artist and English date for a concert, preserving content case for CSS', () => {
        expect(formatGalleryCardCaption({ title: '5 seconds of summer', date: '2026-04-26T12:00:00Z' })).toBe(
            '5 seconds of summer / 26 Apr 2026',
        );
    });
    it('uses festival tags and appends the valid year once', () => {
        expect(formatGalleryCardCaption({ title: 'Neckbreakker', date: '2026-06-26', tags: [festivalTag] })).toBe(
            'Neckbreakker / Copenhell 2026',
        );
        expect(
            formatGalleryCardCaption({
                title: 'Neckbreakker',
                date: '2026-06-26',
                tags: [{ ...festivalTag, tag: 'Copenhell 2026' }],
            }),
        ).toBe('Neckbreakker / Copenhell 2026');
    });
    it('uses a known festival venue when a festival gallery has no festival tag', () => {
        expect(
            formatGalleryCardCaption({
                title: 'Neckbreakker',
                tagGroup: festivalGroup,
                date: '2026-06-26',
                location: { id: 'venue', name: 'Copenhell', city: '', createdAt: '', updatedAt: '' },
            }),
        ).toBe('Neckbreakker / Copenhell 2026');
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
    it('omits invalid dates and preserves a saved edition year without a date', () => {
        expect(formatGalleryCardCaption({ title: 'Artist', date: '2026-02-30' })).toBe('Artist');
        expect(
            formatGalleryCardCaption({
                title: 'Neckbreakker',
                date: 'invalid',
                tags: [{ ...festivalTag, tag: 'Copenhell 2026' }],
            }),
        ).toBe('Neckbreakker / Copenhell 2026');
        expect(
            formatGalleryCardCaption({ title: 'Artist', tagGroup: festivalGroup, tags: ['unresolved'], date: null }),
        ).toBe('Artist');
    });
});
