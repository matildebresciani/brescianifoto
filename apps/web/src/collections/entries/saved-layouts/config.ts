import type { Block } from 'payload';
import { anyone } from '@/access/anyone';
import { Paragraph } from '@/components/organisms/blocks/paragraph/config';
import { TextImage } from '@/components/organisms/blocks/text-image/config';
import { createCollection } from '@/lib/collection-templates/collection';

const slug = 'saved-layout';
const blocks: Block[] = [Paragraph, TextImage];

export const SavedLayouts = createCollection(slug, {
    access: {
        read: anyone,
    },
    admin: {
        group: 'Entries',
        useAsTitle: 'title',
        defaultColumns: ['title', 'updatedAt'],
    },
    labels: {
        singular: 'Saved Layout',
        plural: 'Saved Layouts',
    },
    fields: [
        {
            name: 'title',
            type: 'text',
            required: true,
        },
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
});
