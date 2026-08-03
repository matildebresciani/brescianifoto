import { createBlock } from '@/lib/block-templates/block';
import { payloadGallery } from '@/lib/field-templates/images';

export const Gallery = createBlock('gallery', {
    interfaceName: 'Gallery',
    labels: {
        singular: 'Gallery',
        plural: 'Galleries',
    },
    fields: [payloadGallery()],
});
