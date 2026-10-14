import { unstable_cache } from 'next/cache';
import type { Locale, RoutedCollectionSlug } from '@/i18n/localized-collections';
import { initPayload } from '@/lib/config';
import { formatLinkByCollection } from '@/lib/utilities/format-link';

export const getCachedSitemap = async (collection: RoutedCollectionSlug, locale: Locale) => {
    return unstable_cache(
        async () => {
            const SITE_URL =
                process.env.NEXT_PUBLIC_SERVER_URL ||
                process.env.VERCEL_PROJECT_PRODUCTION_URL ||
                'https://example.com';

            const payload = await initPayload();
            const results = await payload.find({
                collection,
                overrideAccess: false,
                draft: false,
                depth: 0,
                limit: 1000,
                pagination: false,
                locale,
                where: {
                    publishStatus: {
                        equals: 'public',
                    },
                },
                select: {
                    slug: true,
                    updatedAt: true,
                },
            });

            const sitemap = results.docs
                ? results.docs.map((post) => {
                      const link = formatLinkByCollection(post.slug, collection, locale);
                      return {
                          loc: `${SITE_URL}${link}`,
                          ...(post.updatedAt && { lastmod: post.updatedAt }),
                      };
                  })
                : [];

            return sitemap;
        },
        [`${collection}-sitemap`, locale],
        {
            tags: [`${collection}-sitemap`, locale],
        },
    )();
};
