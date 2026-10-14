import { describe, expect, it, vi } from 'vitest';
import { getCachedArchiveSitemaps } from './get-cached-archive-sitemap';

const mocks = vi.hoisted(() => ({ getCachedCollection: vi.fn() }));
vi.mock('./get-cached-collection', () => ({ getCachedCollection: mocks.getCachedCollection }));
vi.mock('@/lib/utilities/get-url', () => ({ getServerSideURL: () => 'https://brescianifoto.example/' }));

describe('gallery group archive sitemap entries', () => {
    it.each([
        'da',
        'en',
    ] as const)('lists enabled group pages with clean %s URLs, including empty groups', async (locale) => {
        mocks.getCachedCollection.mockImplementation(({ collection }: { collection: string }) =>
            Promise.resolve({
                docs:
                    collection === 'post-categories'
                        ? []
                        : [
                              { hasArchivePage: true, title: 'Concerts', slug: 'concerts', updatedAt: '2026-10-14' },
                              { hasArchivePage: false, title: 'Artists', slug: 'artists', updatedAt: '2026-10-14' },
                              { hasArchivePage: true, title: 'Missing slug', updatedAt: '2026-10-14' },
                              { hasArchivePage: true, slug: 'missing-title', updatedAt: '2026-10-14' },
                          ],
            }),
        );
        const sitemap = await getCachedArchiveSitemaps(locale);
        const prefix = locale === 'da' ? '' : '/en';
        expect(sitemap).toContainEqual({
            loc: `https://brescianifoto.example${prefix}/galleries/concerts`,
            lastmod: '2026-10-14',
        });
        expect(sitemap.some((entry) => entry.loc.includes('artists'))).toBe(false);
        expect(sitemap.some((entry) => entry.loc.includes('missing'))).toBe(false);
        expect(sitemap.some((entry) => entry.loc.includes('/groups/'))).toBe(false);
    });
});
