import type { Field, GroupField } from 'payload';

export const payloadFeaturedImage = (): Field => {
    return {
        name: 'featuredImage',
        type: 'upload',
        relationTo: 'media',
    };
};

export const payloadExcerpt = (): Field => {
    return {
        name: 'excerpt',
        type: 'textarea',
    };
};

export const payloadContentExcerpt = (): GroupField => {
    return {
        type: 'group',
        name: 'pageDetails',
        admin: {
            position: 'sidebar',
        },
        localized: true,
        fields: [payloadFeaturedImage(), payloadExcerpt()],
    };
};
