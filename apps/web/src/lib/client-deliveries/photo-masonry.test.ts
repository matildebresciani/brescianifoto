import { describe, expect, it } from 'vitest';
import { getPhotoMasonry, type PhotoMasonryMeasurements } from './photo-masonry';

const measurements: PhotoMasonryMeasurements = {
    width: 1000,
    columns: 4,
    gap: 2,
    landscapeRatio: 4 / 3,
    portraitRatio: 3 / 4,
};
const mixedPhotos = Array.from({ length: 17 }, (_, index) => ({
    width: [900, 1600, 1000][index % 3] ?? 1000,
    height: [1200, 900, 1000][index % 3] ?? 1000,
}));

describe('client photo masonry', () => {
    it('keeps saved order and fills the shortest column from left to right', () => {
        const { tiles } = getPhotoMasonry(mixedPhotos, measurements);
        expect(tiles.map(({ index }) => index)).toEqual(mixedPhotos.map((_, index) => index));
        expect(tiles.slice(0, 5).map(({ column }) => column)).toEqual([0, 1, 2, 3, 1]);
        for (const [index, tile] of tiles.entries()) {
            const previous = tiles[index - 1];
            if (previous) expect(tile.top).toBeGreaterThanOrEqual(previous.top);
        }
    });

    it('uses equal widths, 2px gaps and a shared bottom without overlaps', () => {
        const { height, tiles } = getPhotoMasonry(mixedPhotos, measurements);
        const columnWidth = (1000 - 6) / 4;
        for (const tile of tiles) {
            expect(tile.width).toBe(columnWidth);
            expect(tile.left).toBe(tile.column * (columnWidth + 2));
            expect(tile.left + tile.width).toBeLessThanOrEqual(1000);
            const previous = tiles.filter((other) => other.column === tile.column && other.index < tile.index).at(-1);
            expect(tile.top).toBe(previous ? previous.top + previous.height + 2 : 0);
            if (tile.isBottom) expect(tile.top + tile.height).toBeCloseTo(height);
        }
        expect(tiles.filter(({ isBottom }) => isBottom)).toHaveLength(4);
    });

    it('uses 4:3 landscapes and 3:4 portraits except for the final tiles', () => {
        const { tiles } = getPhotoMasonry(mixedPhotos, measurements);
        for (const tile of tiles) {
            const photo = mixedPhotos[tile.index];
            if (!photo) throw new Error('Missing photo');
            const ratio = photo.width < photo.height ? 3 / 4 : 4 / 3;
            if (!tile.isBottom) expect(tile.width / tile.height).toBeCloseTo(ratio);
            else expect(tile.height).toBeGreaterThanOrEqual((tile.width / ratio) * 0.75 - 0.00001);
        }
    });

    it.each([
        { width: 900, height: 1200, ratio: 3 / 4 },
        { width: 1600, height: 900, ratio: 4 / 3 },
        { width: 1000, height: 1000, ratio: 4 / 3 },
        { width: 10000, height: 100, ratio: 4 / 3 },
    ])('keeps a single $width × $height photo at the normal column size', (photo) => {
        const { height, tiles } = getPhotoMasonry([photo], measurements);
        expect(tiles[0]?.width).toBe((1000 - 6) / 4);
        expect((tiles[0]?.width ?? 0) / height).toBeCloseTo(photo.ratio);
    });

    it('handles empty galleries, small selections, and unmeasured containers', () => {
        expect(getPhotoMasonry([], measurements)).toEqual({ height: 0, tiles: [] });
        expect(getPhotoMasonry(mixedPhotos, { ...measurements, width: 0 })).toEqual({ height: 0, tiles: [] });
        const { tiles, height } = getPhotoMasonry(mixedPhotos.slice(0, 2), measurements);
        expect(tiles).toHaveLength(2);
        expect(tiles.every((tile) => tile.top + tile.height === height)).toBe(true);
    });

    it('keeps 500 photos aligned across responsive widths without mutating source dimensions', () => {
        const photos = Array.from({ length: 30 }, () => mixedPhotos)
            .flat()
            .slice(0, 500);
        const original = structuredClone(photos);
        for (const columns of [2, 3, 4]) {
            for (const width of [288, 343, 500, 672, 928, 1344, 1704]) {
                const { height, tiles } = getPhotoMasonry(photos, { ...measurements, width, columns });
                expect(tiles.map(({ index }) => index)).toEqual(photos.map((_, index) => index));
                for (const tile of tiles) {
                    expect(tile.height).toBeGreaterThan(0);
                    expect(tile.left + tile.width).toBeLessThanOrEqual(width + 0.00001);
                    if (tile.isBottom) expect(tile.top + tile.height).toBeCloseTo(height);
                }
            }
        }
        expect(photos).toEqual(original);
    });
});
