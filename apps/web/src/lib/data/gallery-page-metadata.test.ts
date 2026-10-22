import { describe, expect, it } from 'vitest';
import { imageMock } from '@/__mocks__/storybook-mocks';
import type { Gallery } from '@/payload-types';
import { generateGalleryPageMetadata } from './gallery-page-metadata';

const settings = { metaTitleSuffix: ' | brescianifoto' };

const gallery: Gallery = {
    id: 'show',
    title: 'Artist',
    slug: 'artist-at-vega',
    publishStatus: 'public',
    gallery: [imageMock],
    date: '2026-10-15',
    createdAt: '',
    updatedAt: '',
};

describe('gallery sharing metadata', () => {
    it('uses identity, a canonical URL, and the cover when editor overrides are absent', () => {
        const metadata = generateGalleryPageMetadata(gallery, 'da', 'https://brescianifoto.vercel.app', settings);
        expect(metadata).toMatchObject({
            title: 'Artist | brescianifoto',
            description: 'Artist · 15 Oct 2026 / 1 image',
            alternates: { canonical: '/gallery/artist-at-vega' },
            openGraph: { images: [{ url: 'https://brescianifoto.vercel.app/images/__mocks__/placeholder.jpg' }] },
            twitter: { card: 'summary_large_image' },
        });
    });
    it('honors editor overrides and leaves an empty gallery without a fabricated image', () => {
        expect(
            generateGalleryPageMetadata(
                { ...gallery, gallery: [], meta: { title: 'Editorial title', description: 'Editorial description' } },
                'en',
                'https://example.com',
                settings,
            ),
        ).toMatchObject({
            title: 'Editorial title | brescianifoto',
            description: 'Editorial description',
            alternates: { canonical: '/en/gallery/artist-at-vega' },
            openGraph: { images: undefined },
        });
    });
});
