import { unstable_cache } from 'next/cache';
import type { Locale } from '@/i18n/localized-collections';
import { initPayload } from '@/lib/config';

export const getCachedOptions = (locale: Locale, depth = 0) => {
    return unstable_cache(
        async () => {
            const payload = await initPayload();

            const options = await payload.findGlobal({
                slug: 'options',
                depth,
                locale,
            });

            return options;
        },
        ['global_options', locale],
        {
            tags: ['global_options'],
        },
    )();
};
