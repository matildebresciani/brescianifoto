import type { CollectionConfig } from 'payload';
import { createCollection } from '@/lib/collection-templates/collection';
import { authenticated } from '../../../access/authenticated';

const slug = 'users';

export const Users: CollectionConfig = createCollection(slug, {
    access: {
        admin: authenticated,
        read: authenticated,
    },
    admin: {
        defaultColumns: ['name', 'email'],
        useAsTitle: 'name',
        group: 'Tools & Settings',
    },
    auth: true,
    fields: [
        {
            name: 'name',
            type: 'text',
        },
    ],
    timestamps: true,
});
