import { slugField } from '@/components/molecules/admin/fields/slug';
import { createRoutedCollection } from '@/lib/collection-templates/routed-collection';
import { payloadGallery } from '@/lib/field-templates/images';
import { payloadSEO } from '@/lib/field-templates/seo';
import { paylaodPageName, payloadTitle } from '@/lib/field-templates/title';
import { prepareGalleryIdentity, validateGallerySlug } from '@/lib/payload-hooks/gallery-identity';

const slug = 'galleries';

export const Galleries = createRoutedCollection(
    slug,
    {
        defaultPopulate: { title: true, slug: true, tags: true },
        admin: {
            defaultColumns: ['name', 'title', 'tagGroup', 'slug', 'updatedAt', 'publishStatus'],
            group: 'Content',
        },
        hooks: {
            beforeValidate: [prepareGalleryIdentity, validateGallerySlug],
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
                            {
                                name: 'date',
                                label: 'Show date',
                                type: 'date',
                                admin: {
                                    date: {
                                        pickerAppearance: 'dayOnly',
                                        displayFormat: 'dd/MM/yyyy',
                                    },
                                },
                            },
                        ],
                    },
                    payloadSEO,
                ],
            },
        ],
    },
    {
        titleFields: [
            {
                ...paylaodPageName,
                label: 'Internal gallery name',
                required: false,
                admin: {
                    description:
                        'Leave blank to generate an admin name from the title, venue and show date when saving.',
                },
            },
            {
                ...payloadTitle,
                admin: {
                    description: 'The public gallery title, usually the artist name. Multiple shows can share a title.',
                },
            },
        ],
        slugFields: slugField('title', {
            shouldGenerateFromTitle: false,
            slugOverrides: {
                unique: true,
                admin: {
                    description:
                        'While locked, generated on save from the title, venue and show date. Publishing unlocks and preserves the URL. Unlock to choose a custom slug.',
                },
            },
        }),
    },
);
