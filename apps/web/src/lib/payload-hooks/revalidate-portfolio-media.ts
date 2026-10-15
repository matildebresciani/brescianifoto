import { revalidateTag } from 'next/cache';
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload';

/** Populated gallery caches must drop deleted media and refresh edited photo information. */
export const revalidatePortfolioMedia: CollectionAfterChangeHook & CollectionAfterDeleteHook = ({ doc, req }) => {
    if (!req.context.disableRevalidate) {
        for (const tag of ['media', 'galleries', 'pages', 'options']) revalidateTag(tag, { expire: 0 });
    }
    return doc;
};
