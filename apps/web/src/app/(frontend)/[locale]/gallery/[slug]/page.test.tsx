import type { ReactNode } from 'react';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import GallerySinglePage from './page';

const mocks = vi.hoisted(() => ({ getCachedEntryBySlug: vi.fn(), payloadRedirects: vi.fn() }));
vi.mock('@/lib/data/payload/get-cached-entry-by-slug', () => ({ getCachedEntryBySlug: mocks.getCachedEntryBySlug }));
vi.mock('@/lib/utilities/payload-redirects', () => ({ payloadRedirects: mocks.payloadRedirects }));
vi.mock('next/navigation', () => ({
    notFound: () => {
        throw new Error('NEXT_NOT_FOUND');
    },
}));
vi.mock('next-intl/server', () => ({ setRequestLocale: vi.fn() }));
vi.mock('@/components/molecules/frontend/Gallery', () => ({
    default: () => React.createElement('div', null, 'Images'),
}));
vi.mock('@/components/molecules/frontend/GalleryHero', () => ({
    default: () => React.createElement('h1', null, 'Gallery'),
}));
vi.mock('@/components/organisms/blocks/base-block/BaseBlock', () => ({
    default: ({ children }: { children: ReactNode }) => React.createElement('section', null, children),
}));

beforeEach(() => vi.stubGlobal('React', React));
afterEach(() => vi.unstubAllGlobals());

describe('gallery URL redirects', () => {
    it.each([
        ['da', '/gallery/old-slug'],
        ['en', '/en/gallery/old-slug'],
    ])('checks the %s public URL before returning a missing-gallery response', async (locale, path) => {
        mocks.getCachedEntryBySlug.mockResolvedValue(null);
        await expect(GallerySinglePage({ params: Promise.resolve({ locale, slug: 'old-slug' }) })).rejects.toThrow(
            'NEXT_NOT_FOUND',
        );
        expect(mocks.payloadRedirects).toHaveBeenCalledWith(path);
    });

    it('serves an existing gallery before consulting redirects', async () => {
        mocks.getCachedEntryBySlug.mockResolvedValue({ title: 'Gallery', gallery: [] });
        const html = renderToStaticMarkup(
            await GallerySinglePage({ params: Promise.resolve({ locale: 'da', slug: 'gallery' }) }),
        );
        expect(html).toContain('Images');
        expect(mocks.payloadRedirects).not.toHaveBeenCalled();
    });
});
