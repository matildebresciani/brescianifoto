import type { Field } from 'payload';

export const contentMeta = () => {
    const data: Field = {
        type: 'group',
        name: 'contentMeta',
        label: 'Page Details',
        localized: true,
        admin: {
            position: 'sidebar',
        },
        fields: [
            {
                name: 'featuredImage',
                type: 'upload',
                relationTo: 'media',
                localized: true,
            },
            {
                name: 'excerpt',
                type: 'textarea',
                localized: true,
            },
        ],
    };
    return data;
};
