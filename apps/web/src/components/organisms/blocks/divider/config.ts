import { createBlock } from '@/lib/block-templates/block';

export const Divider = createBlock('divider', {
    interfaceName: 'Divider',
    labels: {
        singular: 'Divider',
        plural: 'Dividers',
    },
    fields: [
        {
            type: 'select',
            name: 'size',
            label: 'Spacing',
            defaultValue: 'medium',
            options: [
                { label: 'Small', value: 'small' },
                { label: 'Medium', value: 'medium' },
                { label: 'Large', value: 'large' },
            ],
        },
        {
            type: 'checkbox',
            name: 'showLine',
            label: 'Show line',
            defaultValue: false,
        },
    ],
});
