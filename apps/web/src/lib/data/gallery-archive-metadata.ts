import type { Metadata } from 'next';
import type { Locale } from '@/i18n/localized-collections';
import { formatGalleryArchiveLink } from '@/lib/utilities/format-link';
import { formatPageTitle } from './metadata-title';
import type { GalleryArchive } from './payload/get-gallery-archive';

/** Shares the resolved archive title and canonical URL between group and tag pages. */
export const generateGalleryArchiveMetadata = (archive: GalleryArchive, locale: Locale): Metadata => {
    const canonical = formatGalleryArchiveLink(archive.slug, locale);
    const title = formatPageTitle(archive.title);
    return {
        title,
        alternates: { canonical },
        openGraph: {
            title,
            url: canonical ?? undefined,
            type: 'website',
        },
    };
};
