import { anyone } from '@/access/anyone';
import { createCollection } from '@/lib/collection-templates/collection';

const slug = 'redirects';

export const Redirects = createCollection(slug, {
    access: {
        read: anyone,
    },
    labels: {
        singular: 'Redirect',
        plural: 'Redirects',
    },
    admin: {
        group: 'Tools & Settings',
        useAsTitle: 'redirectFrom',
        defaultColumns: ['redirectFrom', 'redirectTo', 'redirectType', 'active'],
    },
    fields: [
        {
            type: 'checkbox',
            label: 'Activate Redirect',
            name: 'active',
            defaultValue: false,
        },
        {
            type: 'row',
            fields: [
                {
                    name: 'redirectType',
                    type: 'select',
                    required: false,
                    admin: {
                        width: '20%',
                    },
                    options: [
                        {
                            label: 'Permanent Redirect (308)',
                            value: '308',
                        },
                        {
                            label: 'Temporary Redirect (307)',
                            value: '307',
                        },
                    ],
                    defaultValue: '308',
                },
                {
                    name: 'redirectFrom',
                    type: 'text',
                    required: false,
                    admin: {
                        description: 'Redirect from should be a relative path. (E.g. "/old-page")',
                    },
                },
                {
                    name: 'redirectTo',
                    type: 'text',
                    required: false,
                    admin: {
                        description: 'The redirect should be to a complete URL. (E.g. "https://www.oak.dk/new-page")',
                    },
                },
            ],
        },
    ],
});
