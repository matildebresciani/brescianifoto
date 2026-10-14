import { createRoutedCollection } from '@/lib/collection-templates/routed-collection';
import { payloadGallery } from '@/lib/field-templates/images';
import { payloadSEO } from '@/lib/field-templates/seo';

const slug = 'galleries';

export const Galleries = createRoutedCollection(slug, {
    defaultPopulate: { title: true, slug: true, tags: true },
    admin: {
        defaultColumns: ['name', 'title', 'tagGroup', 'slug', 'updatedAt', 'publishStatus'],
        group: 'Content',
    },
    fields: [
        {
            type: 'tabs',
            tabs: [
                {
                    label: 'Gallery',
                    fields: [payloadGallery({ required: true })],
                },
                {
                    label: 'Meta',
                    fields: [
                        {
                            name: 'tagGroup',
                            label: 'Main browsing group',
                            type: 'relationship',
                            relationTo: 'tag-groups',
                            index: true,
                            filterOptions: { hasArchivePage: { equals: true } },
                            admin: {
                                description:
                                    'Choose one section, such as Concerts or Festivals. Tags can describe artists and festivals across sections.',
                            },
                        },
                        {
                            name: 'tags',
                            type: 'relationship',
                            hasMany: true,
                            relationTo: 'tags',
                            admin: { position: 'sidebar' },
                        },
                        {
                            name: 'location',
                            type: 'relationship',
                            relationTo: 'locations',
                        },
                        { name: 'date', type: 'date' },
                    ],
                },
                payloadSEO,
            ],
        },
    ],
});
