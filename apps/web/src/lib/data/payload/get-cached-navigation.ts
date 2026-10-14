import { unstable_cache } from 'next/cache';
import type { Locale } from '@/i18n/localized-collections';
import { initPayload } from '@/lib/config';

export const getCachedNavigation = (navigationKey: string, locale: Locale) => {
    return unstable_cache(
        async () => {
            const payload = await initPayload();
            const nav = await payload.find({
                collection: 'navigation',
                draft: false,
                limit: 1,
                overrideAccess: false,
                pagination: false,
                locale,
                where: {
                    [navigationKey]: {
                        equals: true,
                    },
                },
            });

            return nav.docs?.[0]?.navItems;
        },
        ['navigation', navigationKey, locale],
        {
            tags: ['navigation'],
        },
    )();
};
