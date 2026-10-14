import type { Where } from 'payload';
import { cache } from 'react';
import type { Locale } from '@/i18n/localized-collections';
import { getCachedCollection } from './get-cached-collection';

/** A public archive resolved from either a browsing group or an individual tag. */
export type GalleryArchive = {
    kind: 'group' | 'tag';
    id: string;
    slug: string;
    title: string;
    galleryWhere: Where;
};

/** Resolves groups before tags while retaining Payload's localized text fallback. */
export const getGalleryArchive = cache(async (slug: string, locale: Locale): Promise<GalleryArchive | null> => {
    // Matching the returned localized slug also supports URLs inherited from the default locale.
    const groups = await getCachedCollection({
        collection: 'tag-groups',
        locale,
        publicOnly: false,
        limit: 0,
        sort: 'name',
        whereFields: { hasArchivePage: { equals: true } },
    });
    const group = groups.docs.find((entry) => entry.hasArchivePage && entry.slug === slug);
    if (group) {
        if (!group.title?.trim()) return null;
        return {
            kind: 'group',
            id: group.id,
            slug,
            title: group.title,
            galleryWhere: { tagGroup: { equals: group.id } },
        };
    }

    const tags = await getCachedCollection({
        collection: 'tags',
        locale,
        publicOnly: false,
        limit: 0,
        sort: 'name',
    });
    const tag = tags.docs.find((entry) => entry.slug === slug);
    if (!tag) return null;
    return {
        kind: 'tag',
        id: tag.id,
        slug,
        title: tag.tag || tag.name,
        galleryWhere: { tags: { equals: tag.id } },
    };
});
