import { unstable_cache } from 'next/cache';
import { draftMode } from 'next/headers';
import { cache } from 'react';
import { defaultLocale, type Locale, type RoutedCollectionSlug } from '@/i18n/localized-collections';
import { initPayload } from '@/lib/config';

type Props<C extends RoutedCollectionSlug> = {
    collection: C;
    slug: string;
    locale?: Locale;
};

export const getCachedEntryBySlug = cache(
    async <C extends RoutedCollectionSlug>({ collection, slug, locale }: Props<C>) => {
        const { isEnabled: draft } = await draftMode();

        if (draft) {
            const payload = await initPayload();
            const result = await payload.find({
                collection,
                draft,
                limit: 1,
                overrideAccess: draft,
                locale: locale,
                pagination: false,
                where: {
                    slug: {
                        equals: slug,
                    },
                    publishStatus: {
                        equals: 'public',
                    },
                },
            });

            return result.docs?.[0] || null;
        }
        return unstable_cache(
            async () => {
                const payload = await initPayload();
                const result = await payload.find({
                    collection,
                    draft: false,
                    limit: 1,
                    overrideAccess: false,
                    locale: locale,
                    pagination: false,
                    where: {
                        slug: {
                            equals: slug,
                        },
                        publishStatus: {
                            equals: 'public',
                        },
                    },
                });

                return result.docs?.[0] || null;
            },
            [`${collection}-by-slug`, slug, locale ?? defaultLocale],
            {
                tags: [`${collection}-by-slug_${slug}`, collection],
            },
        )();
    },
);
