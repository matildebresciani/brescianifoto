import { describe, expect, it, vi } from 'vitest';
import { revalidateEntry } from './entry-revalidation';

const mocks = vi.hoisted(() => ({ revalidateTag: vi.fn(), revalidatePath: vi.fn() }));
vi.mock('next/cache', () => mocks);

describe('gallery archive cache invalidation', () => {
    it.each([
        'tags',
        'tag-groups',
    ] as const)('clears archive data and populated navigation references after %s changes', (collection) => {
        revalidateEntry({ id: 'archive', slug: 'festivals' }, collection);
        expect(mocks.revalidateTag).toHaveBeenCalledWith(collection, { expire: 0 });
        expect(mocks.revalidateTag).toHaveBeenCalledWith(`${collection}-sitemap`, { expire: 0 });
        expect(mocks.revalidateTag).toHaveBeenCalledWith('navigation', { expire: 0 });
    });

    it('invalidates gallery list data and individual shoot pages after a gallery edit', () => {
        revalidateEntry({ id: 'shoot', slug: 'band-at-copenhell' }, 'galleries');
        expect(mocks.revalidateTag).toHaveBeenCalledWith('galleries', { expire: 0 });
        expect(mocks.revalidatePath).toHaveBeenCalledWith('/gallery/band-at-copenhell');
        expect(mocks.revalidatePath).toHaveBeenCalledWith('/en/gallery/band-at-copenhell');
    });
});
