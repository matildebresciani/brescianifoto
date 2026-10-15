import { describe, expect, it } from 'vitest';
import { getGalleryColumns } from './gallery-columns';

describe('gallery photo placement', () => {
    const photos = ['photo-1', 'photo-2', 'photo-3', 'photo-4', 'photo-5', 'photo-6', 'photo-7'];

    it('assigns desktop photos left to right before continuing down each column', () => {
        const columns = getGalleryColumns(photos, 3);

        expect(columns.map((column) => column.items.map(({ item }) => item))).toEqual([
            ['photo-1', 'photo-4', 'photo-7'],
            ['photo-2', 'photo-5'],
            ['photo-3', 'photo-6'],
        ]);
        expect(photos).toEqual(['photo-1', 'photo-2', 'photo-3', 'photo-4', 'photo-5', 'photo-6', 'photo-7']);
    });

    it('redistributes photos into two columns without losing their original lightbox indices', () => {
        const columns = getGalleryColumns(photos, 2);

        expect(columns.map((column) => column.items)).toEqual([
            [
                { item: 'photo-1', index: 0 },
                { item: 'photo-3', index: 2 },
                { item: 'photo-5', index: 4 },
                { item: 'photo-7', index: 6 },
            ],
            [
                { item: 'photo-2', index: 1 },
                { item: 'photo-4', index: 3 },
                { item: 'photo-6', index: 5 },
            ],
        ]);
    });

    it('handles galleries shorter than a row and empty galleries', () => {
        expect(getGalleryColumns(['only-photo'], 3).map((column) => column.items)).toEqual([
            [{ item: 'only-photo', index: 0 }],
            [],
            [],
        ]);
        expect(getGalleryColumns([], 2).map((column) => column.items)).toEqual([[], []]);
    });
});
