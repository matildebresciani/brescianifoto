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
    mocks.options.mockResolvedValue({ meta: { metaTitleSuffix: ' | brescianifoto' } });
});

describe('public page metadata branding', () => {
    it('uses the requested locale and reflects prefix, suffix, and blank settings', async () => {
        mocks.options.mockResolvedValueOnce({ meta: { metaTitlePrefix: 'Studio | ' } });
        expect(await generateEntryMetadata('contact', 'pages', 'en')).toMatchObject({ title: 'Studio | Contact' });
        expect(mocks.options).toHaveBeenLastCalledWith('en');
        mocks.options.mockResolvedValueOnce({ meta: { metaTitleSuffix: ' — Photographer' } });
        expect(await generateEntryMetadata('contact', 'pages', 'en')).toMatchObject({
            title: 'Contact — Photographer',
        });
        mocks.options.mockResolvedValueOnce({ meta: { metaTitlePrefix: '', metaTitleSuffix: '' } });
        expect(await generateEntryMetadata('contact', 'pages', 'en')).toMatchObject({ title: 'Contact' });
    });

    it('applies the CMS suffix to ordinary pages without replacing inherited social images', async () => {
        expect(await generateEntryMetadata('contact', 'pages', 'da')).toEqual({
            title: 'Contact | brescianifoto',
            description: 'Get in touch.',
            alternates: { canonical: '/contact' },
        });
    });

    it('keeps CMS title overrides and social images while removing duplicate legacy branding', async () => {
        mocks.entry.mockResolvedValue({
            title: 'Contact',
            slug: 'contact',
            meta: { title: 'brescianifoto — Book a shoot', image: 'photo' },
        });
        mocks.options.mockResolvedValue({
            meta: { metaTitleSuffix: ' | brescianifoto' },
        });
        mocks.image.mockResolvedValue('/cover.jpg');
        expect(await generateEntryMetadata('contact', 'pages', 'da')).toMatchObject({
            title: 'Book a shoot | brescianifoto',
            openGraph: { title: 'Book a shoot | brescianifoto', images: [{ url: 'https://example.test/cover.jpg' }] },
        });
    });

    it('applies the CMS suffix to post archives and retains their authored description and image', async () => {
        mocks.options.mockResolvedValue({
            meta: { metaTitleSuffix: ' | brescianifoto' },
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
            title: 'Backstage | brescianifoto',
            description: 'Stories from the pit.',
            openGraph: { title: 'Backstage | brescianifoto', images: [{ url: 'https://example.test/archive.jpg' }] },
        });
    });
});
