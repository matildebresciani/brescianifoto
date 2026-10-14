import { unstable_cache } from 'next/cache';
import { draftMode } from 'next/headers';
import type { CollectionSlug, Where } from 'payload';
import { cache } from 'react';
import { defaultLocale, type Locale } from '@/i18n/localized-collections';
import { initPayload } from '@/lib/config';

type Props<C extends CollectionSlug | 'media'> = {
    collection: C;
    id: string;
    locale?: Locale;
    publicOnly?: boolean;
};

export const getCachedEntryById = cache(
    async <C extends CollectionSlug | 'media'>({ collection, id, locale, publicOnly = true }: Props<C>) => {
        // Do not create payload instance here,
        // if database connection is not available, it will throw an error
        // because the payload instance will try to connect to the database
        // If you only create it when it is needed, it will not throw an error and cache correctly
        // 🛑 const payload = await initPayload();

        const { isEnabled: draft } = await draftMode();

        const filterPublicOnly = publicOnly ? { publishStatus: { equals: 'public' } } : undefined;

        const where: Where = {
            id: {
                equals: id,
            },
            ...filterPublicOnly,
        };

        if (draft) {
            const payload = await initPayload();
            const result = await payload.find({
                collection,
                draft,
                limit: 1,
                overrideAccess: draft,
                locale: locale,
                pagination: false,
                where,
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
                    where,
                });

                return result.docs?.[0] || null;
            },
            [`${collection}-by-id`, id, locale ?? defaultLocale],
            {
                tags: [`${collection}-by-id_${id}`, collection],
            },
        )();
    },
);
