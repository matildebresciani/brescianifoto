import { unstable_cache } from 'next/cache';
import { draftMode } from 'next/headers';
import type { CollectionSlug, Sort, TypedCollectionSelect, Where } from 'payload';
import { cache } from 'react';
import { defaultLocale, type Locale } from '@/i18n/localized-collections';
import { initPayload } from '@/lib/config';

type Props<C extends CollectionSlug> = {
    collection: C;
    ids: string[] | undefined;
    locale?: Locale;
    limit?: number;
    whereFields?: Partial<Where>;
    sort?: Sort;
    select?: TypedCollectionSelect[C];
    publicOnly?: boolean;
    /**
     * If true, the returned entries will be sorted in the same order as the provided IDs and override the `sort` prop.
     */
    sortByIds?: boolean;
};

export const getCachedEntriesByIds = cache(async <C extends CollectionSlug>(props: Props<C>) => {
    const {
        collection,
        ids,
        locale = defaultLocale,
        whereFields,
        limit,
        sort,
        select,
        publicOnly = true,
        sortByIds,
    } = props;
    const { isEnabled: draft } = await draftMode();
    const filterPublicOnly = publicOnly ? { publishStatus: { equals: 'public' } } : undefined;
    if (!ids || ids.length === 0) return null;

    const where: Where = {
        id: {
            in: ids,
        },
        ...filterPublicOnly,
        ...whereFields,
    };

    const sortResultsByIds = <T extends { id: string }>(docs: T[]): T[] => {
        const idMap = new Map(docs.map((doc) => [doc.id, doc]));
        return ids.map((id) => idMap.get(id)).filter((doc): doc is T => doc !== undefined);
    };

    if (draft) {
        const payload = await initPayload();
        const result = await payload.find({
            collection,
            draft,
            limit,
            overrideAccess: draft,
            locale,
            pagination: false,
            sort: sort ?? '-createdAt',
            select,
            where,
        });

        if (sortByIds) return result.docs ? sortResultsByIds(result.docs) : null;
        return result.docs || null;
    }

    return unstable_cache(
        async ({ collection, limit, sort, locale, select }: Props<C>, where: Where) => {
            const payload = await initPayload();
            const result = await payload.find({
                collection,
                draft: false,
                limit,
                overrideAccess: false,
                locale,
                pagination: false,
                sort: sort ?? '-createdAt',
                select,
                where,
            });

            if (sortByIds) return result.docs ? sortResultsByIds(result.docs) : null;
            return result.docs || null;
        },
        [],
        {
            tags: [...ids.map((id) => `${collection}-by-id_${id}`), collection],
        },
    )({ collection, limit, ids, sort, locale, select }, where);
});
