import type { CollectionAfterChangeHook, Payload, PayloadRequest } from 'payload';
import { type Locale, locales } from '@/i18n/localized-collections';
import { createAutomaticGalleryMix } from '@/lib/utilities/automatic-gallery-mix';

/** Persists the mix once, refreshing only for gallery IDs that have never been public. */
export async function syncAutomaticGalleryMix(payload: Payload, locale: Locale, req?: PayloadRequest) {
    const [options, galleries] = await Promise.all([
        payload.findGlobal({ slug: 'options', locale, fallbackLocale: false, depth: 0, req }),
        payload.find({
            collection: 'galleries',
            locale,
            depth: 1,
            pagination: false,
            draft: false,
            overrideAccess: false,
            where: { publishStatus: { equals: 'public' } },
            req,
        }),
    ]);
    const saved = options.automaticGalleryMix;
    const considered = new Set(saved?.consideredGalleryIds ?? []);
    const hasNewGallery = galleries.docs.some((gallery) => !considered.has(gallery.id));
    if (saved?.isInitialized && !hasNewGallery) return;

    for (const gallery of galleries.docs) considered.add(gallery.id);
    await payload.updateGlobal({
        slug: 'options',
        locale,
        req,
        context: req?.context,
        data: {
            automaticGalleryMix: {
                isInitialized: true,
                consideredGalleryIds: [...considered],
                photos: createAutomaticGalleryMix(galleries.docs),
            },
        },
    });
}

export const refreshAutomaticGalleryMix: CollectionAfterChangeHook = async ({ doc, req }) => {
    if (doc.publishStatus !== 'public' || req.context.disablePortfolioMix) return doc;
    // A new default-locale gallery can also become public through localized content fallback.
    for (const locale of locales) await syncAutomaticGalleryMix(req.payload, locale, { ...req, locale });
    return doc;
};
