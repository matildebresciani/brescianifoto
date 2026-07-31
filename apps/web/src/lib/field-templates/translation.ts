import type { Field } from 'payload';
import type { PayloadTranslationProps } from './types/field-template-types';

export const payloadTranslationField = ({ name, label, defaultValue }: PayloadTranslationProps): Field => {
    return {
        type: 'text',
        name,
        label,
        localized: true,
        defaultValue,
    };
};
