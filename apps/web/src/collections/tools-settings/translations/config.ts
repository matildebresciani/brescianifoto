import { createGlobalCollection } from '@/lib/collection-templates/global-collection';
import { general } from './tabs/general';

const slug = 'translations';

export const Translations = createGlobalCollection(slug, {
    admin: {
        group: 'Tools & Settings',
    },
    fields: [
        {
            type: 'tabs',
            tabs: [
                {
                    name: 'general',
                    label: 'General',
                    fields: general,
                },
            ],
        },
    ],
});
