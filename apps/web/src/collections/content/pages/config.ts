import type { Block } from 'payload';
import { Embed } from '@/collections/embed/config';
import { Divider } from '@/components/organisms/blocks/divider/config';
import { Hero } from '@/components/organisms/blocks/hero/config';
import { Paragraph } from '@/components/organisms/blocks/paragraph/config';
import { SavedLayoutsBlock } from '@/components/organisms/blocks/saved-layouts/config';
import { TextImage } from '@/components/organisms/blocks/text-image/config';
import { createRoutedCollection } from '@/lib/collection-templates/routed-collection';
import { payloadSEO } from '@/lib/field-templates/seo';
import { populatePublishedAt } from '../../../lib/hooks/populate-published-at';
import { enforceHomepage } from './hooks/enforce-homepage';

const collection = 'pages';
const blocks: Block[] = [Divider, Embed, Hero, Paragraph, TextImage, SavedLayoutsBlock];

export const Pages = createRoutedCollection(collection, {
    defaultPopulate: {
        title: true,
        slug: true,
    },
    admin: {
        defaultColumns: ['name', 'title', 'slug', 'updatedAt', 'publishStatus'],
        group: 'Content',
    },
    fields: [
        {
            type: 'tabs',
            tabs: [
                {
                    fields: [
                        {
                            name: 'layout',
                            type: 'blocks',
                            localized: true,
                            blocks,
                            admin: {
                                initCollapsed: false,
                            },
                        },
                    ],
                    label: 'Content',
                },
                payloadSEO,
            ],
        },
    ],
    hooks: {
        beforeChange: [populatePublishedAt, enforceHomepage],
    },
});
