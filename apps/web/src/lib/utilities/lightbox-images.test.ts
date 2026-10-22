import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Media } from '@/payload-types';
import {
    canPreloadLightboxImages,
    getLightboxImageDimensions,
    getLightboxImageKey,
    getLightboxImageSize,
    getLightboxNeighbors,
} from './lightbox-images';

const photo = (id: string, width = 1600, height = 900): Media => ({
    id,
    url: `/photos/${id}.jpg`,
    width,
    height,
    createdAt: '2026-10-21',
    updatedAt: '2026-10-21',
});

afterEach(() => vi.unstubAllGlobals());

describe('lightbox image sizing', () => {
    const viewport = { width: 1200, height: 700 };

    it('fits landscape and portrait requests to the actual photo area', () => {
        expect(getLightboxImageDimensions(photo('portrait', 900, 1200), viewport)).toEqual({ width: 525, height: 700 });
        expect(getLightboxImageSize(photo('landscape'), viewport)).toBe('1200px');
        expect(getLightboxImageSize(photo('portrait', 900, 1200), viewport)).toBe('525px');
        expect(getLightboxImageSize(photo('small', 300, 200), viewport)).toBe('300px');
        expect(getLightboxImageSize(photo('mobile'), { width: 374, height: 650 })).toBe('374px');
    });

    it('requests extra resolution only when zoom is explicitly enabled', () => {
        expect(getLightboxImageSize(photo('portrait', 900, 1200), viewport, 2)).toBe('1050px');
    });

    it('handles missing or invalid dimensions without an invalid sizes attribute', () => {
        for (const width of [undefined, null, 0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
            expect(getLightboxImageSize({ ...photo('invalid'), width }, viewport)).toBe('1200px');
        }
    });
});

describe('bounded lightbox neighbors', () => {
    const items = [photo('one'), photo('two'), photo('three'), photo('four')];

    it('selects only the next photo, including wraparound', () => {
        expect(getLightboxNeighbors(items, 0)).toEqual([items[1]]);
        expect(getLightboxNeighbors(items, 3)).toEqual([items[0]]);
    });

    it('avoids duplicate requests for two-photo and repeated-source galleries', () => {
        expect(getLightboxNeighbors(items.slice(0, 2), 0)).toEqual([items[1]]);
        expect(getLightboxNeighbors([photo('one'), { ...photo('one'), id: 'duplicate' }], 0)).toEqual([]);
        expect(getLightboxNeighbors([photo('one')], 0)).toEqual([]);
        expect(getLightboxNeighbors([], 0)).toEqual([]);
    });

    it('distinguishes updated media while skipping missing URLs', () => {
        expect(getLightboxImageKey(photo('one'))).not.toBe(
            getLightboxImageKey({ ...photo('one'), updatedAt: '2026-10-22' }),
        );
        expect(getLightboxNeighbors([photo('one'), { ...photo('two'), url: null }], 0)).toEqual([]);
    });

    it('reuses a versioned source when captions or other metadata change', () => {
        const original = { ...photo('one'), imageVersion: 'file-version' };
        const edited = { ...original, updatedAt: '2026-10-22' };
        expect(getLightboxImageKey(original)).toBe(getLightboxImageKey(edited));
        expect(getLightboxNeighbors([original, edited], 0)).toEqual([]);
        expect(getLightboxImageKey(original)).not.toBe(getLightboxImageKey({ ...edited, imageVersion: 'replacement' }));
    });
});

describe('connection-aware preloading', () => {
    it.each([
        { saveData: true },
        { effectiveType: 'slow-2g' },
        { effectiveType: '2g' },
    ])('skips speculative requests for %j', (connection) => {
        vi.stubGlobal('navigator', { connection });
        expect(canPreloadLightboxImages()).toBe(false);
    });

    it('allows preloading on normal connections and browsers without the connection API', () => {
        vi.stubGlobal('navigator', { connection: { saveData: false, effectiveType: '4g' } });
        expect(canPreloadLightboxImages()).toBe(true);
        vi.stubGlobal('navigator', {});
        expect(canPreloadLightboxImages()).toBe(true);
    });
});
