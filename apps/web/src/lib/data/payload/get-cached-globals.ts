import { unstable_cache } from 'next/cache';
import type { Config } from 'src/payload-types';
import type { Locale } from '@/i18n/localized-collections';
import { initPayload } from '@/lib/config';

type Global = keyof Config['globals'];

async function getGlobal(slug: Global, locale: Locale, depth = 0) {
    const payload = await initPayload();

    const global = await payload.findGlobal({
        slug,
        depth,
        locale,
    });

    return global;
}

/**
 * Returns a unstable_cache function mapped with the cache tag for the slug
 */
export const getCachedGlobal = (slug: Global, locale: Locale, depth = 0) =>
    unstable_cache(async () => getGlobal(slug, locale, depth), [slug, locale, depth.toString()], {
        tags: ['global_options'],
    })();
