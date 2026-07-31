import type { CollectionConfig, CollectionSlug } from 'payload';
import { authenticated } from '@/access/authenticated';
import { authenticatedOrPublished } from '@/access/authenticatedOrPublished';
import { createAfterChangeRevalidateHook, createAfterDeleteRevalidateHook } from '../payload-hooks/revalidate-content';

export const createCollection = <Slug extends CollectionSlug>(
    slug: Slug,
    config: Omit<CollectionConfig<Slug>, 'slug'>,
): CollectionConfig<Slug> => {
    return {
        slug,
        ...config,
        access: {
            create: authenticated,
            delete: authenticated,
            read: authenticatedOrPublished,
            update: authenticated,
            ...config.access,
        },
        hooks: {
            ...config.hooks,
            afterChange: [...(config.hooks?.afterChange ?? []), createAfterChangeRevalidateHook(slug)],
            afterDelete: [...(config.hooks?.afterDelete ?? []), createAfterDeleteRevalidateHook(slug)],
        },
    };
};
