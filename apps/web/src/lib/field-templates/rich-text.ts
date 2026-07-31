import { FixedToolbarFeature, HeadingFeature, InlineToolbarFeature, lexicalEditor } from '@payloadcms/richtext-lexical';
import type { Field } from 'payload';
import { HeadingFormatFeature } from '../plugins/lexical/heading-format/server/heading-format';
import type { PayloadNamingProps } from './types/field-template-types';

export const payloadRichText = (props: PayloadNamingProps = {}): Field => {
    const { name = 'richText', label = 'Rich Text' } = props;

    return {
        type: 'richText',
        label: label,
        name: name,
        localized: true,
        editor: lexicalEditor({
            features: ({ rootFeatures }) => {
                return [
                    ...rootFeatures,
                    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
                    FixedToolbarFeature(),
                    InlineToolbarFeature(),
                    HeadingFormatFeature(),
                ];
            },
        }),
    };
};
