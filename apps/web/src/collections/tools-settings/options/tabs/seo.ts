import type { Field } from 'payload';

export const seoFields: Field[] = [
    {
        name: 'indexing',
        type: 'group',
        admin: {
            description: 'IMPORTANT! Unchecking this will remove the site from all organic listings on Google.',
        },
        fields: [
            {
                name: 'siteIndexable',
                label: 'Is Site Indexable?',
                type: 'checkbox',
                defaultValue: true,
            },
        ],
    },
    {
        name: 'meta',
        type: 'group',
        fields: [
            {
                type: 'row',
                fields: [
                    {
                        name: 'metaTitlePrefix',
                        label: 'Default Meta Title Prefix',
                        type: 'text',
                        localized: true,
                    },
                    {
                        name: 'metaTitleSuffix',
                        label: 'Default Meta Title Suffix',
                        type: 'text',
                        localized: true,
                    },
                ],
            },
            {
                name: 'defaultImage',
                label: 'Default OG Share Image',
                type: 'upload',
                relationTo: 'media',
            },
        ],
    },
    {
        name: 'structuredData',
        type: 'group',
        fields: [
            {
                name: 'structuredData',
                label: 'Global Structured Data',
                type: 'code',
                localized: true,
            },
        ],
    },
];
