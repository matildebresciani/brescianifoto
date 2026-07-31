import type { GlobalConfig, GlobalSlug } from 'payload';
import { anyone } from '@/access/anyone';
import { authenticated } from '@/access/authenticated';
import { createGlobalAfterChangeRevalidateHook } from '../payload-hooks/revalidate-content';

export const createGlobalCollection = <Slug extends GlobalSlug>(
    slug: Slug,
    config: Omit<GlobalConfig<Slug>, 'slug'>,
): GlobalConfig<Slug> => {
    return {
        slug,
        ...config,
        access: {
            read: anyone,
            update: authenticated,
            ...config.access,
        },
        hooks: {
            ...config.hooks,
            afterChange: [...(config.hooks?.afterChange ?? []), createGlobalAfterChangeRevalidateHook(slug)],
        },
    };
};
