import { slugField } from '@/components/molecules/admin/fields/slug';
import { createRoutedCollection } from '@/lib/collection-templates/routed-collection';
import { payloadGallery } from '@/lib/field-templates/images';
import { payloadSEO } from '@/lib/field-templates/seo';
import { paylaodPageName, payloadTitle } from '@/lib/field-templates/title';
import { prepareGalleryIdentity, validateGalleryDate, validateGallerySlug } from '@/lib/payload-hooks/gallery-identity';

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
            beforeValidate: [validateGalleryDate, prepareGalleryIdentity, validateGallerySlug],
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
                                admin: {
                                    description:
                                        'For festival galleries, choose the festival itself, such as Copenhell. This supplies the festival name in captions and URLs.',
                                },
                            },
                            {
                                name: 'datePrecision',
                                label: 'Date precision',
                                type: 'select',
                                defaultValue: 'day',
                                options: [
                                    { label: 'Exact date', value: 'day' },
                                    { label: 'Year only', value: 'year' },
                                ],
                                admin: {
                                    description:
                                        'Choose Year only when you know the festival edition but do not want to set a specific show date.',
                                },
                            },
                            {
                                name: 'date',
                                label: 'Show date',
                                type: 'date',
                                admin: {
                                    condition: (_data, siblingData) => siblingData.datePrecision !== 'year',
                                    date: {
                                        pickerAppearance: 'dayOnly',
                                        displayFormat: 'dd/MM/yyyy',
                                    },
                                },
                            },
                            {
                                name: 'year',
                                label: 'Year',
                                type: 'number',
                                min: 1000,
                                max: 9999,
                                admin: {
                                    condition: (_data, siblingData) => siblingData.datePrecision === 'year',
                                    step: 1,
                                    placeholder: '2026',
                                    description: 'Enter a four-digit year. No day or month is added.',
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
                        'Leave blank to generate an admin name from the title, location and date or year when saving.',
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
                        'While locked, generated on save from the title, location and date. Festival URLs use the edition year only. Publishing unlocks and preserves the URL. Unlock to choose a custom slug.',
                },
            },
        }),
    },
);
