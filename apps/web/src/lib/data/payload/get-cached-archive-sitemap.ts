import { defaultLocale, type Locale, localizedPaths } from '@/i18n/localized-collections';
import { getServerSideURL } from '@/lib/utilities/get-url';
import { getCachedCollection } from './get-cached-collection';

export const getCachedArchiveSitemaps = async (locale: Locale) => {
    const localizedSiteUrl = `${getServerSideURL()}${locale === defaultLocale ? '' : `/${locale}`}`;
    const localizedPostsSlug = localizedPaths.posts[locale];

    const tags = await getCachedCollection({
        collection: 'post-categories',
        publicOnly: false,
        limit: 0,
        locale,
    });

    // Filtering all tags that includes posts (viewPostsInCategory) and formatting them to return a valid sitemap structure
    const tagsWithPosts = tags.docs
        .filter((tag) => tag.viewPostsInCategory?.docs?.length)
        .map((tag) => {
            if (!tag.slug) return null;
            return {
                loc: `${localizedSiteUrl}/${localizedPostsSlug}/${tag.slug}`,
            };
        })
        .filter((tag) => tag !== null);

    const sitemap = [
        // Adding static root archive for posts collection
        {
            loc: `${localizedSiteUrl}/${localizedPostsSlug}`,
        },
        // Adding all sub archives for posts collection
        ...tagsWithPosts,
    ];

    return sitemap;
};
