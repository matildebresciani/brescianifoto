import { anyone } from '@/access/anyone';
import { slugField } from '@/components/molecules/admin/fields/slug';
import { createCollection } from '@/lib/collection-templates/collection';

export const Tags = createCollection('tags', {
    access: {
        read: anyone,
    },
    admin: {
        group: 'Taxonomies',
        useAsTitle: 'tag',
        defaultColumns: ['name', 'slug'],
    },
    labels: {
        singular: 'Tag',
        plural: 'Tags',
    },
    fields: [
        {
            name: 'name',
            label: 'Tag Name',
            type: 'text',
            required: true,
            admin: {
                description:
                    'This is the name of the tag, it will only be used in the admin panel. And is not localized.',
            },
        },
        {
            type: 'text',
            name: 'tag',
            label: 'Tag',
            localized: true,
        },
        {
            type: 'checkbox',
            name: 'showTagInFiltration',
            label: 'Show Tag in Filtration',
            admin: {
                position: 'sidebar',
            },
        },
        {
            name: 'viewGalleriesInTag',
            label: 'Galleries in Tag',
            type: 'join',
            collection: 'galleries',
            on: 'tags',
        },

        ...slugField('tag'),
    ],
});
