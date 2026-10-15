import type { DateField, SelectField } from 'payload';

export const payloadPublishStatus: SelectField = {
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

export const payloadPublishedAt: DateField = {
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
            ({ siblingData, previousSiblingDoc, value, previousValue }) => {
                const publishStatus = siblingData.publishStatus ?? previousSiblingDoc?.publishStatus;
                const publishedAt = value || previousValue;
                if (publishStatus === 'public' && !publishedAt) return new Date().toISOString();
                return publishedAt ?? value;
            },
        ],
    },
};
