import type { CollectionBeforeChangeHook } from 'payload';
import type { Page } from '../../../../payload-types';

export const enforceHomepage: CollectionBeforeChangeHook<Page> = async ({ data, req, originalDoc }) => {
    const { payload, context } = req;

    if (context.skipHomepageEnforcement) {
        return data;
    }

    const options = await payload.findGlobal({
        slug: 'options',
    });

    let homepageId: string | undefined | null = null;

    if (typeof options.defaultPages?.homepage === 'string') {
        homepageId = options.defaultPages.homepage;
    } else if (typeof options.defaultPages?.homepage === 'object') {
        homepageId = options.defaultPages?.homepage?.id;
    }

    // Ensures always keeping homepage without a slug
    if (homepageId && homepageId === originalDoc?.id) {
        data.slug = '/';
    }

    return data;
};
