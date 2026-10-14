import { unstable_cache } from 'next/cache';
import { draftMode } from 'next/headers';
import type { CollectionSlug, Where } from 'payload';
import { cache } from 'react';
import type { Locale } from '@/i18n/localized-collections';
import { initPayload } from '@/lib/config';

type Props<C extends CollectionSlug> = {
    collection: C;
    locale: Locale;
    limit?: number;
    page?: number;
    sort?: string;
    depth?: number;
    publicOnly?: boolean;
    whereFields?: Partial<Where>;
};

export const getCachedCollection = cache(async <C extends CollectionSlug>(props: Props<C>) => {
    const {
        collection,
        locale,
        limit = 10,
        page = 1,
        sort = 'title',
        depth = 0,
        publicOnly = true,
        whereFields,
    } = props;
    const { isEnabled: draft } = await draftMode();

    const filterPublicOnly = publicOnly ? { publishStatus: { equals: 'public' } } : undefined;

    const where: Where = {
        ...filterPublicOnly,
        ...whereFields,
    };

    const params = {
        collection,
        limit,
        page,
        sort,
        depth,
        draft,
        overrideAccess: draft,
        locale,
        where,
    };

    if (draft) {
        const payload = await initPayload();
        const result = await payload.find(params);

        return result || null;
    }

    return unstable_cache(
        // biome-ignore lint: we need to define these for the unstable cache
        async ({ collection, limit, page, sort, locale }: Props<C>, where: Where) => {
            const payload = await initPayload();
            const result = await payload.find({
                ...params,
                draft: false,
                overrideAccess: false,
            });

            return result || null;
        },
        [],
        {
            tags: [collection],
        },
    )({ collection, limit, page, sort, depth, locale }, where);
});
