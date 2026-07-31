import { locales, type RoutedCollectionSlug } from '@/i18n/localized-collections';
import { initPayload } from '../config';

export const generateStaticParamsForCollection = async (collection: RoutedCollectionSlug, isCatchAll = false) => {
    const payload = await initPayload();
    const posts = (
        await Promise.all(
            locales.map(async (locale) => {
                const posts = await payload.find({
                    collection,
                    draft: false,
                    limit: 1000,
                    overrideAccess: false,
                    pagination: false,
                    locale,
                });

                return posts.docs.map((post) => ({
                    post,
                    locale,
                }));
            }),
        )
    ).flat();

    if (isCatchAll) {
        const params = posts.map(({ post, locale }) => {
            return { locale, slug: [post.slug] };
        });
        return params;
    }

    const params = posts.map(({ post, locale }) => {
        return { locale, slug: post.slug };
    });

    return params;
};
