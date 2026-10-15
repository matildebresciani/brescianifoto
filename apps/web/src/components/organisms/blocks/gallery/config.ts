import { createBlock } from '@/lib/block-templates/block';
import { payloadGallery } from '@/lib/field-templates/images';

export const Gallery = createBlock('gallery', {
    interfaceName: 'GalleryBlock',
    labels: {
        singular: 'Gallery',
        plural: 'Galleries',
    },
    fields: [
        {
            name: 'selectionMode',
            label: 'Photo selection',
            type: 'radio',
            defaultValue: 'random',
            hooks: {
                // Documents saved before this field existed must retain their manual selection.
                afterRead: [({ value }) => value ?? 'custom'],
            },
            options: [
                { label: 'Random', value: 'random' },
                { label: 'Custom', value: 'custom' },
            ],
            admin: {
                layout: 'horizontal',
                description:
                    'Random uses a saved mix from public galleries. It refreshes when a new gallery first becomes public. An empty custom selection uses the same mix.',
            },
        },
        {
            ...payloadGallery(),
            admin: {
                ...payloadGallery().admin,
                condition: (_data, siblingData) => siblingData.selectionMode !== 'random',
            },
        },
    ],
});
