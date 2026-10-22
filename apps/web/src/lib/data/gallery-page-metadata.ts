import type { Metadata } from 'next';
import type { Locale } from '@/i18n/localized-collections';
import { getGalleryCoverImage, payloadObject } from '@/lib/utilities/composables';
import { formatLinkByCollection } from '@/lib/utilities/format-link';
import { formatGalleryMetadata } from '@/lib/utilities/gallery-metadata';
import type { Gallery } from '@/payload-types';
import { formatPageTitle } from './metadata-title';

/** Uses editor overrides when present and the gallery's own identity and cover otherwise. */
export function generateGalleryPageMetadata(gallery: Gallery, locale: Locale, serverURL: string): Metadata {
    const title = formatPageTitle(gallery.meta?.title?.trim() || gallery.title);
    const description =
        gallery.meta?.description?.trim() ||
        gallery.contentMeta?.excerpt?.trim() ||
        `${gallery.title} · ${formatGalleryMetadata(gallery)}`;
    const cover = payloadObject(gallery.meta?.image) ?? getGalleryCoverImage(gallery);
    const canonical = formatLinkByCollection(gallery.slug, 'galleries', locale) ?? undefined;
    const images = cover?.url
        ? [{ url: new URL(cover.url, serverURL).toString(), alt: cover.alt || gallery.title }]
        : undefined;
    return {
        title,
        description,
        alternates: { canonical },
        openGraph: { type: 'website', title, description, url: canonical, images },
        twitter: { card: 'summary_large_image', title, description, images },
    };
}
