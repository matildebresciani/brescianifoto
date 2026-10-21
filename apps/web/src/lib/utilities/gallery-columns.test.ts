import { describe, expect, it } from 'vitest';
import { getGalleryColumns } from './gallery-columns';

const photosWithRatios = (ratios: number[]) =>
    ratios.map((ratio, index) => ({ id: `photo-${index}`, width: 100, height: ratio * 100 }));

describe('gallery photo placement', () => {
    it('fills the shortest column while resolving equal heights from left to right', () => {
        const photos = photosWithRatios([1.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]);
        const columns = getGalleryColumns(photos, 3);
        expect(columns.map((column) => column.items.map(({ index }) => index))).toEqual([[0], [1, 3, 5], [2, 4, 6]]);
        expect(columns.map(({ id }) => id)).toEqual(['gallery-column-0', 'gallery-column-1', 'gallery-column-2']);
    });

    it('preserves every original photo, index and input order in two columns', () => {
        const photos = Object.freeze(photosWithRatios([1.5, 0.5, 0.5, 0.5, 0.5]));
        const columns = getGalleryColumns(photos, 2);
        expect(columns.map((column) => column.items.map(({ index }) => index))).toEqual([
            [0, 4],
            [1, 2, 3],
        ]);
        const placed = columns.flatMap(({ items }) => items).sort((a, b) => a.index - b.index);
        expect(placed).toHaveLength(photos.length);
        placed.forEach(({ item, index }, position) => {
            expect(index).toBe(position);
            expect(item).toBe(photos[position]);
        });
    });

    it('accounts for actual gaps and column width when comparing the next available space', () => {
        const photos = photosWithRatios([2, 1, 0.95, 0.5]);
        const placements = (columnWidth: number, gap: number) =>
            getGalleryColumns(photos, 2, { columnWidth, gap }).map(({ items }) => items.map(({ index }) => index));
        expect(placements(100, 0)).toEqual([[0], [1, 2, 3]]);
        expect(placements(100, 10)).toEqual([
            [0, 3],
            [1, 2],
        ]);
        expect(placements(1000, 10)).toEqual([[0], [1, 2, 3]]);
    });

    it('reduces the bottom gap when the middle column used to receive all the landscapes', () => {
        const photos = photosWithRatios([1.5, 0.5, 1.5, 1.5, 0.5, 1.5, 1.5, 0.5, 1.5]);
        const columns = getGalleryColumns(photos, 3, { columnWidth: 300, gap: 16 });
        const heightOf = (items: typeof photos) =>
            items.reduce((height, photo) => height + (photo.height / photo.width) * 300, 0) +
            Math.max(0, items.length - 1) * 16;
        const oldHeights = [0, 1, 2].map((column) => heightOf(photos.filter((_, index) => index % 3 === column)));
        const newHeights = columns.map(({ items }) => heightOf(items.map(({ item }) => item)));
        const spread = (heights: number[]) => Math.max(...heights) - Math.min(...heights);
        expect(spread(newHeights)).toBeLessThan(spread(oldHeights) / 2);
        expect(columns[1]?.items.at(-1)?.index).toBe(8);
    });

    it.each([
        {},
        { width: null, height: null },
        { width: 100 },
        { width: 0, height: 100 },
        { width: 100, height: -1 },
        { width: Number.NaN, height: 100 },
        { width: 100, height: Number.POSITIVE_INFINITY },
    ])('uses a square estimate for invalid dimensions: %j', (dimensions) => {
        const photos = [dimensions, { width: 100, height: 75 }, { width: 100, height: 50 }];
        expect(getGalleryColumns(photos, 2).map(({ items }) => items.map(({ index }) => index))).toEqual([[0], [1, 2]]);
    });

    it('handles empty galleries and galleries shorter than a row', () => {
        expect(getGalleryColumns([], 2).map(({ items }) => items)).toEqual([[], []]);
        expect(getGalleryColumns([], 3).map(({ items }) => items)).toEqual([[], [], []]);
        const photos = photosWithRatios([1, 1]);
        expect(getGalleryColumns(photos, 3).map(({ items }) => items.map(({ index }) => index))).toEqual([
            [0],
            [1],
            [],
        ]);
    });

    it('retains left-to-right placement for equal-height photos and deterministic pre-measurement output', () => {
        const photos = photosWithRatios([1, 1, 1, 1, 1, 1, 1]);
        expect(getGalleryColumns(photos, 3).map(({ items }) => items.map(({ index }) => index))).toEqual([
            [0, 3, 6],
            [1, 4],
            [2, 5],
        ]);
        expect(getGalleryColumns(photos, 3)).toEqual(getGalleryColumns(photos, 3));
    });
});
