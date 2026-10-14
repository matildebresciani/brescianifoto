import type { Field } from 'payload';
import { presentationCopy } from '@/i18n/presentation';
import { payloadTranslationField } from '@/lib/field-templates/translation';

export const general: Field[] = [
    {
        type: 'group',
        name: 'footer',
        label: 'Footer',
        fields: [
            payloadTranslationField({
                name: 'tlCopyright',
                label: 'Footer credit (use {year} for the current year)',
                defaultValue: presentationCopy.footerTemplate,
            }),
        ],
    },
];
