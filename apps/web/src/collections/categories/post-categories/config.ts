import { slugField } from '@/components/molecules/admin/fields/slug';
import { createCollection } from '@/lib/collection-templates/collection';
import { payloadTitleCollection } from '@/lib/field-templates/title';

const slug = 'post-categories';

export const PostCategories = createCollection(slug, {
    admin: {
        useAsTitle: 'title',
        group: 'Categories',
    },
    fields: [
        ...payloadTitleCollection,
        {
            name: 'viewPostsInCategory',
            label: 'Posts in Category',
            type: 'join',
            collection: 'posts',
            on: 'categories',
        },
        ...slugField(),
    ],
    versions: {
        drafts: {
            autosave: {
                interval: 2500,
            },
        },
        maxPerDoc: 50,
    },
});
