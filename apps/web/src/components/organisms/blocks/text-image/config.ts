import { createBlock } from '@/lib/block-templates/block';
import { payloadConditionalLink } from '@/lib/field-templates/links';
import { payloadRichText } from '@/lib/field-templates/rich-text';

export const TextImage = createBlock('text-image', {
    interfaceName: 'TextImage',
    labels: {
        singular: 'TextImage',
        plural: 'TextImages',
    },
    fields: [
        {
            type: 'radio',
            name: 'order',
            label: 'Order',
            required: true,
            defaultValue: 'image-left',
            options: [
                {
                    label: 'Image Left',
                    value: 'image-left',
                },
                {
                    label: 'Image Right',
                    value: 'image-right',
                },
            ],
        },
        {
            type: 'upload',
            name: 'image',
            label: 'Image',
            relationTo: 'media',
            required: true,
        },
        payloadRichText(),
        payloadConditionalLink(),
    ],
});
