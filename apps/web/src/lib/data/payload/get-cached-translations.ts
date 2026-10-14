import { unstable_cache } from 'next/cache';
import type { Locale } from '@/i18n/localized-collections';
import { initPayload } from '@/lib/config';

export const getCachedTranslations = (locale: Locale, depth = 0) => {
    return unstable_cache(
        async () => {
            const payload = await initPayload();

            const translations = await payload.findGlobal({
                slug: 'translations',
                depth,
                locale,
            });

            return translations;
        },
        ['translations', locale],
        {
            tags: ['translations'],
        },
    )();
};
