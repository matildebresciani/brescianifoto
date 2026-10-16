import type { Field } from 'payload';
import { payloadLinkInner } from '@/lib/field-templates/links';

export const globalContentFields: Field[] = [
    {
        name: 'automaticGalleryMix',
        type: 'group',
        localized: true,
        admin: { hidden: true, readOnly: true },
        fields: [
            { name: 'isInitialized', type: 'checkbox', defaultValue: false },
            { name: 'consideredGalleryIds', type: 'text', hasMany: true },
            { name: 'photos', type: 'upload', relationTo: 'media', hasMany: true },
        ],
    },
    {
        label: 'Set Homepage',
        name: 'defaultPages',
        type: 'group',
        fields: [
            {
                type: 'relationship',
                label: 'Choose Homepage',
                name: 'homepage',
                relationTo: 'pages',
                required: false,
                localized: true,
            },
        ],
    },
    {
        label: 'Company Details',
        name: 'companyDetails',
        type: 'group',
        fields: [
            {
                type: 'row',
                fields: [
                    {
                        name: 'companyName',
                        label: 'Company Name',
                        type: 'text',
                        localized: true,
                    },
                    {
                        name: 'vatNumber',
                        label: 'VAT (CVR)',
                        type: 'text',
                        localized: true,
                    },
                ],
            },
            {
                type: 'row',
                fields: [
                    {
                        name: 'address',
                        label: 'Address',
                        type: 'text',
                        localized: true,
                    },
                    {
                        name: 'city',
                        label: 'Zip & City',
                        type: 'text',
                        localized: true,
                    },
                ],
            },
            {
                type: 'row',
                fields: [
                    {
                        name: 'email',
                        label: 'E-mail',
                        type: 'email',
                        localized: true,
                        defaultValue: 'matildepio@hotmail.dk',
                    },
                    {
                        name: 'phone',
                        label: 'Phone Number',
                        type: 'text',
                        localized: true,
                    },
                ],
            },
        ],
    },
    {
        name: 'socialLinks',
        label: 'Social Links',
        type: 'array',
        localized: true,
        defaultValue: [
            {
                link: { type: 'custom', label: 'instagram', url: 'https://www.instagram.com/brescianifoto/' },
            },
        ],
        fields: [payloadLinkInner({ localized: false })],
    },
];
