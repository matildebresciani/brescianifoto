import { anyone } from '@/access/anyone';
import { slugField } from '@/components/molecules/admin/fields/slug';
import { createCollection } from '@/lib/collection-templates/collection';
import { createGalleryArchiveValidationHook } from '@/lib/payload-hooks/validate-gallery-archive';

export const TagGroups = createCollection('tag-groups', {
    access: {
        read: anyone,
    },
    admin: {
        group: 'Taxonomies',
        useAsTitle: 'name',
        defaultColumns: ['name', 'hasArchivePage', 'slug', 'updatedAt'],
    },
    labels: {
        singular: 'Tag Group',
        plural: 'Tag Groups',
    },
    hooks: {
        beforeChange: [createGalleryArchiveValidationHook('tag-groups')],
    },
    fields: [
        {
            name: 'name',
            label: 'Tag Group Name',
            type: 'text',
            required: true,
            admin: {
                description: 'Used to organize tags in the admin panel. This name is not localized.',
            },
        },
        {
            name: 'hasArchivePage',
            label: 'Enable gallery archive page',
            type: 'checkbox',
            defaultValue: false,
            admin: {
                position: 'sidebar',
                description: 'Allow this group to be a main gallery section, such as Concerts or Festivals.',
            },
        },
        {
            name: 'title',
            label: 'Public title',
            type: 'text',
            localized: true,
            admin: {
                description: 'Required for public groups. Used as the gallery archive heading.',
            },
        },
        {
            name: 'viewTagsInGroup',
            label: 'Tags in Group',
            type: 'join',
            collection: 'tags',
            on: 'tagGroup',
        },
        {
            name: 'viewGalleriesInGroup',
            label: 'Galleries in Group',
            type: 'join',
            collection: 'galleries',
            on: 'tagGroup',
        },
        ...slugField('title', {
            slugOverrides: {
                admin: {
                    description: 'Public groups share /galleries/[slug] with tags. Each archive slug must be distinct.',
                },
            },
        }),
    ],
});
