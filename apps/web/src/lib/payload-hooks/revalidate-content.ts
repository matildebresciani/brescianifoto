import { revalidateTag } from 'next/cache';
import type {
    CollectionAfterChangeHook,
    CollectionAfterDeleteHook,
    CollectionSlug,
    GlobalAfterChangeHook,
    GlobalSlug,
} from 'payload';
import { revalidateEntry } from '../utilities/entry-revalidation';

export const createAfterChangeRevalidateHook = (slug: CollectionSlug): CollectionAfterChangeHook => {
    return ({ doc, previousDoc, req: { context } }) => {
        if (!context.disableRevalidate) {
            if (doc.publishStatus === 'public' || doc._status === 'published') {
                revalidateEntry(doc, slug);
            }

            // Clear the old route too when content is renamed or unpublished.
            if (previousDoc?.publishStatus === 'public' || previousDoc?._status === 'published') {
                revalidateEntry(previousDoc, slug);
            }
        }
        return doc;
    };
};

export const createAfterDeleteRevalidateHook = (slug: CollectionSlug): CollectionAfterDeleteHook => {
    return ({ doc, req: { context } }) => {
        if (!context.disableRevalidate) {
            revalidateEntry(doc, slug);
        }

        return doc;
    };
};

export const createGlobalAfterChangeRevalidateHook = (slug: GlobalSlug): GlobalAfterChangeHook => {
    return ({ doc, req: { context } }) => {
        if (!context.disableRevalidate) {
            revalidateTag(slug, { expire: 0 });
        }
        return doc;
    };
};
