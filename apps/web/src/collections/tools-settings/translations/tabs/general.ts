import type { Field } from 'payload';
import { payloadTranslationField } from '@/lib/field-templates/translation';

export const general: Field[] = [
    {
        type: 'group',
        name: 'footer',
        label: 'Footer',
        fields: [
            payloadTranslationField({
                name: 'tlCopyright',
                label: '© 2026 Alle rettigheder forbeholdes.',
                defaultValue: '© 2026 Alle rettigheder forbeholdes.',
            }),
        ],
    },
];
