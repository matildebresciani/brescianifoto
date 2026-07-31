import { createCollection } from '@/lib/collection-templates/collection';

const slug = 'api-keys';

export const ApiKeys = createCollection(slug, {
    labels: {
        singular: 'API Key',
        plural: 'API Keys',
    },
    admin: {
        group: 'Tools & Settings',
        useAsTitle: 'title',
    },
    auth: {
        useAPIKey: true,
        disableLocalStrategy: true,
    },
    fields: [
        {
            name: 'title',
            type: 'text',
            required: true,
        },
    ],
});
