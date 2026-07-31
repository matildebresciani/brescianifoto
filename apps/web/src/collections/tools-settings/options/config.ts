import type { GlobalConfig } from 'payload';
import { anyone } from '@/access/anyone';
import { createGlobalCollection } from '@/lib/collection-templates/global-collection';
import { changeHomepage } from './hooks/change-homepage';
import { archiveFields } from './tabs/archives';
import { globalContentFields } from './tabs/global-content';
import { scriptFields } from './tabs/scripts';
import { seoFields } from './tabs/seo';

const slug = 'options';

export const Options: GlobalConfig = createGlobalCollection(slug, {
    admin: {
        group: 'Tools & Settings',
    },
    access: {
        read: anyone,
    },
    fields: [
        {
            type: 'tabs',
            tabs: [
                {
                    label: 'Global Content',
                    fields: globalContentFields,
                },
                {
                    label: 'Archives',
                    name: 'archives',
                    fields: archiveFields,
                },
                {
                    label: 'SEO',
                    fields: seoFields,
                },
                {
                    label: 'Scripts',
                    fields: scriptFields,
                },
            ],
        },
    ],
    hooks: {
        afterChange: [changeHomepage],
    },
});
