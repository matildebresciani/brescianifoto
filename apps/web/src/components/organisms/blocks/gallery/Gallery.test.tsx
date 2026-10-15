import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GalleryBlock as GalleryProps, Media } from '@/payload-types';
import GalleryBlock from './Gallery';

const mocks = vi.hoisted(() => ({ getAutomaticGalleryMix: vi.fn() }));
vi.mock('@/lib/data/payload/get-automatic-gallery-mix', () => mocks);
vi.mock('@/components/molecules/frontend/Gallery', () => ({
    default: ({ images }: { images: (string | Media)[] }) =>
        React.createElement('div', null, images.map((item) => (typeof item === 'string' ? item : item.id)).join(',')),
}));
beforeEach(() => {
    vi.stubGlobal('React', React);
    mocks.getAutomaticGalleryMix.mockResolvedValue(['mix-a', 'mix-b']);
});
afterEach(() => vi.unstubAllGlobals());

const render = async (block: GalleryProps) =>
    renderToStaticMarkup(await GalleryBlock({ block, pageId: 'page', locale: 'da' }));

describe('gallery block selection', () => {
    it('preserves legacy selections and custom ordering', async () => {
        for (const selectionMode of [undefined, 'custom'] as const) {
            expect(await render({ blockType: 'gallery', selectionMode, gallery: ['second', 'first'] })).toContain(
                'second,first',
            );
        }
        expect(mocks.getAutomaticGalleryMix).not.toHaveBeenCalled();
    });
    it('uses Random without discarding saved custom photos', async () => {
        const block = { blockType: 'gallery' as const, selectionMode: 'random' as const, gallery: ['custom'] };
        expect(await render(block)).toContain('mix-a,mix-b');
        expect(block.gallery).toEqual(['custom']);
    });
    it('falls back for empty Custom and renders no section for an empty mix', async () => {
        expect(await render({ blockType: 'gallery', selectionMode: 'custom', gallery: [] })).toContain('mix-a,mix-b');
        mocks.getAutomaticGalleryMix.mockResolvedValue([]);
        expect(await render({ blockType: 'gallery', selectionMode: 'random' })).toBe('');
    });
});
