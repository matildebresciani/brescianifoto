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
            if (doc._status === 'published') {
                revalidateEntry(doc, slug);
            }

            // If the page was previously published, we need to revalidate the old path
            if (previousDoc?._status === 'published' && doc._status !== 'published') {
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
    return () => {
        revalidateTag(slug, 'max');
    };
};
