import type { Locale } from '@/i18n/localized-collections';
import { initPayload } from '@/lib/config';
import type { Media } from '@/payload-types';

export const getImageSlugFromMedia = async (item: Media | string, locale: Locale) => {
    if (typeof item === 'object' && item.url) return item.url;

    if (typeof item === 'string') {
        // TODO: Enable caching on media
        // const image = await getCachedEntryById({
        //     collection: 'media',
        //     id: item,
        //     locale,
        // });

        const payload = await initPayload();

        const image = await payload.findByID({
            collection: 'media',
            id: item,
            locale,
        });
        if (image?.url) {
            return image.url;
        }
    }

    return null;
};
