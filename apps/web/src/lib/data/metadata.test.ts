import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateArchiveMetadata, generateEntryMetadata } from './metadata';

const mocks = vi.hoisted(() => ({ entry: vi.fn(), options: vi.fn(), image: vi.fn() }));
vi.mock('../config', () => ({ initPayload: vi.fn() }));
vi.mock('./payload/get-cached-entry-by-slug', () => ({ getCachedEntryBySlug: mocks.entry }));
vi.mock('./payload/get-cached-options', () => ({ getCachedOptions: mocks.options }));
vi.mock('./payload/get-image-url', () => ({ getImageSlugFromMedia: mocks.image }));
vi.mock('../utilities/get-url', () => ({ getServerSideURL: () => 'https://example.test' }));

beforeEach(() => {
    mocks.entry.mockResolvedValue({ title: 'Contact', slug: 'contact', meta: { description: 'Get in touch.' } });
    mocks.options.mockResolvedValue({});
});

describe('public page metadata branding', () => {
    it('prefixes ordinary pages without replacing inherited social images', async () => {
        expect(await generateEntryMetadata('contact', 'pages', 'da')).toEqual({
            title: 'brescianifoto | Contact',
            description: 'Get in touch.',
            alternates: { canonical: '/contact' },
        });
    });

    it('keeps CMS title overrides and social images while removing duplicate legacy branding', async () => {
        mocks.entry.mockResolvedValue({
            title: 'Contact',
            slug: 'contact',
            meta: { title: 'Book a shoot', image: 'photo' },
        });
        mocks.options.mockResolvedValue({
            meta: { metaTitlePrefix: 'brescianifoto | ', metaTitleSuffix: ' — brescianifoto' },
        });
        mocks.image.mockResolvedValue('/cover.jpg');
        expect(await generateEntryMetadata('contact', 'pages', 'da')).toMatchObject({
            title: 'brescianifoto | Book a shoot',
            openGraph: { title: 'brescianifoto | Book a shoot', images: [{ url: 'https://example.test/cover.jpg' }] },
        });
    });

    it('prefixes post archives and retains their authored description and image', async () => {
        mocks.options.mockResolvedValue({
            archives: {
                postsArchiveMeta: {
                    title: 'Backstage',
                    description: 'Stories from the pit.',
                    image: { url: '/archive.jpg' },
                },
            },
        });
        expect(
            await generateArchiveMetadata({ collection: 'posts', slug: undefined, locale: 'da', pageNumber: 1 }),
        ).toMatchObject({
            title: 'brescianifoto | Backstage',
            description: 'Stories from the pit.',
            openGraph: { title: 'brescianifoto | Backstage', images: [{ url: 'https://example.test/archive.jpg' }] },
        });
    });
});
