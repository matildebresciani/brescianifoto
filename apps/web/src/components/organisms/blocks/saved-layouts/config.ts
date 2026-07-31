import { createBlock } from '@/lib/block-templates/block';

const slug = 'saved-layouts';

export const SavedLayoutsBlock = createBlock(slug, {
    imageURL: undefined,
    interfaceName: 'SavedLayoutsBlock',
    labels: {
        singular: 'Saved Layout',
        plural: 'Saved Layouts',
    },
    fields: [
        {
            name: 'savedLayout',
            label: 'Saved Layout',
            type: 'relationship',
            relationTo: 'saved-layout',
            required: true,
        },
    ],
});
