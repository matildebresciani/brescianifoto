import { revalidatePath, revalidateTag } from 'next/cache';
import type { CollectionSlug } from 'payload';
import { isRoutedCollection, locales } from '@/i18n/localized-collections';
import type { Page } from '@/payload-types';
import { formatLinkByCollection } from './format-link';

export const revalidateEntry = (doc: Pick<Page, 'id' | 'slug'>, collection: CollectionSlug) => {
    if (isRoutedCollection(collection)) {
        const localizedPaths = locales.map((locale) => formatLinkByCollection(doc.slug, collection, locale));
        console.log(`Revalidating ${collection} at path: ${doc.slug}`);
        localizedPaths.forEach((path) => {
            if (path) revalidatePath(path);
        });
    }

    // Revalidating entire collection to hit the archive page
    revalidateTag(collection, { expire: 0 });
    revalidateTag(`${collection}-sitemap`, { expire: 0 });
    revalidateTag(`${collection}-by-id_${doc.id}`, { expire: 0 });
    revalidateTag(`${collection}-by-slug_${doc.slug}`, { expire: 0 });
    if (collection === 'tags' || collection === 'tag-groups') {
        // Cached menus contain populated archive records, including their slug and public-page toggle.
        revalidateTag('navigation', { expire: 0 });
    }
};
