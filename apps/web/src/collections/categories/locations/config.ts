import { anyone } from '@/access/anyone';
import { createCollection } from '@/lib/collection-templates/collection';

export const Locations = createCollection('locations', {
    access: {
        read: anyone,
    },
    admin: {
        group: 'Taxonomies',
        useAsTitle: 'name',
        defaultColumns: ['name', 'city'],
    },
    labels: {
        singular: 'Location',
        plural: 'Locations',
    },
    fields: [
        {
            name: 'name',
            label: 'Location Name',
            type: 'text',
            required: true,
        },
        {
            name: 'city',
            label: 'City',
            type: 'text',
        },
    ],
});
