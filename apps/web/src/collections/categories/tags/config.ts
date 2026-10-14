import { anyone } from '@/access/anyone';
import { slugField } from '@/components/molecules/admin/fields/slug';
import { createCollection } from '@/lib/collection-templates/collection';
import { createGalleryArchiveValidationHook } from '@/lib/payload-hooks/validate-gallery-archive';

export const Tags = createCollection('tags', {
    access: {
        read: anyone,
    },
    admin: {
        group: 'Taxonomies',
        useAsTitle: 'tag',
        defaultColumns: ['name', 'tagGroup', 'slug'],
    },
    labels: {
        singular: 'Tag',
        plural: 'Tags',
    },
    hooks: {
        beforeChange: [createGalleryArchiveValidationHook('tags')],
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
            name: 'tagGroup',
            label: 'Tag Group',
            type: 'relationship',
            relationTo: 'tag-groups',
            admin: {
                position: 'sidebar',
                description: 'Optionally organize this tag into a group, such as Festivals or Artists.',
            },
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
