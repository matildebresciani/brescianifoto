import { revalidatePath, revalidateTag } from 'next/cache';
import type { CollectionSlug } from 'payload';
import { isRoutedCollection, locales } from '@/i18n/localized-collections';
import type { Page, Post } from '@/payload-types';
import { formatLinkByCollection } from './format-link';

export const revalidateEntry = (doc: Page | Post, collection: CollectionSlug) => {
    if (isRoutedCollection(collection)) {
        const localizedPaths = locales.map((locale) => formatLinkByCollection(doc.slug, collection, locale));
        console.log(`Revalidating ${collection} at path: ${doc.slug}`);
        localizedPaths.forEach((path) => {
            if (path) revalidatePath(path);
        });
    }

    // Revalidating entire collection to hit the archive page
    revalidateTag(collection, 'max');
    revalidateTag(`${collection}-sitemap`, 'max');
    revalidateTag(`${collection}-by-id_${doc.id}`, 'max');
    revalidateTag(`${collection}-by-slug_${doc.slug}`, 'max');
};
