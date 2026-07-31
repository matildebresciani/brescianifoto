import type { Field } from 'payload';

export const payloadPublishStatus: Field = {
    name: 'publishStatus',
    type: 'select',
    admin: {
        position: 'sidebar',
    },
    options: [
        {
            label: 'Draft',
            value: 'draft',
        },
        {
            label: 'Waiting for Approval',
            value: 'pendingApproval',
        },
        {
            label: 'Public',
            value: 'public',
        },
    ],
    defaultValue: 'draft',
    required: true,
    localized: true,
};

export const payloadPublishedAt: Field = {
    name: 'publishedAt',
    type: 'date',
    admin: {
        date: {
            pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
    },
    hooks: {
        beforeChange: [
            ({ siblingData, value }) => {
                if (siblingData._status === 'published' && !value) {
                    return new Date();
                }
                return value;
            },
        ],
    },
};
