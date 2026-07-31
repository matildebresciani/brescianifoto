import { anyone } from '@/access/anyone';
import { createCollection } from '@/lib/collection-templates/collection';

const slug = 'faqs';

export const Faqs = createCollection(slug, {
    access: {
        read: anyone,
    },
    labels: {
        singular: 'FAQ',
        plural: 'FAQs',
    },
    admin: {
        group: 'Entries',
        useAsTitle: 'question',
        defaultColumns: ['question', 'publishStatus'],
    },
    fields: [
        {
            type: 'text',
            label: 'Question',
            name: 'question',
            required: false,
            localized: true,
        },
        {
            type: 'richText',
            label: 'Answer',
            name: 'answer',
            localized: true,
        },
    ],
});
