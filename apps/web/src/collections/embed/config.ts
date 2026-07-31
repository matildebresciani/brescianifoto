import { createBlock } from '@/lib/block-templates/block';

const slug = 'embed';
export const Embed = createBlock(slug, {
    interfaceName: 'Embed',
    labels: {
        singular: 'Embed',
        plural: 'Embeds',
    },
    fields: [
        {
            type: 'code',
            name: 'embedCode',
            label: 'Embed Code',
            admin: {
                language: 'javascript',
            },
        },
    ],
});
