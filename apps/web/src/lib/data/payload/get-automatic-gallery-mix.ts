import type { Locale } from '@/i18n/localized-collections';
import { resolveAutomaticGalleryMix } from '@/lib/utilities/automatic-gallery-mix';
import { getCachedCollection } from './get-cached-collection';
import { getCachedOptions } from './get-cached-options';

/** Reads the saved selection, checking current publication state even in draft preview. */
export async function getAutomaticGalleryMix(locale: Locale) {
    const [options, galleries] = await Promise.all([
        getCachedOptions(locale),
        getCachedCollection({ collection: 'galleries', locale, depth: 1, limit: 0 }),
    ]);
    const ids =
        options.automaticGalleryMix?.photos?.map((photo) => (typeof photo === 'string' ? photo : photo.id)) ?? [];
    return resolveAutomaticGalleryMix(
        ids,
        galleries.docs.filter((gallery) => gallery.publishStatus === 'public'),
    );
}
