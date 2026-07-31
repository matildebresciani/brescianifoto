import { InlineToolbarFeature, lexicalEditor } from '@payloadcms/richtext-lexical';
import type { Field } from 'payload';
import { lexicalLink } from '@/components/molecules/admin/fields/defaultLexical';
import type { PayloadBaseProps } from './types/field-template-types';

export const payloadLabel = (props: PayloadBaseProps = {}): Field => {
    const { required = false, localized = true } = props;

    return {
        type: 'text',
        name: 'label',
        label: 'Label',
        defaultValue: 'This is your label',
        localized,
        required,
    };
};

export const payloadHeading = (props: PayloadBaseProps = {}): Field => {
    const { required = true, localized = true } = props;

    return {
        type: 'text',
        name: 'heading',
        label: 'Heading',
        defaultValue: 'This is your heading',
        localized,
        required,
    };
};

export const payloadManchet = (props: PayloadBaseProps = {}): Field => {
    const { required = false, localized = true } = props;

    return {
        type: 'richText',
        name: 'manchet',
        label: 'Manchet',
        required,
        localized,
        editor: lexicalEditor({
            features: () => {
                return [InlineToolbarFeature(), lexicalLink()];
            },
        }),
    };
};

export const payloadHeadingCollection = [payloadLabel(), payloadHeading(), payloadManchet()];
