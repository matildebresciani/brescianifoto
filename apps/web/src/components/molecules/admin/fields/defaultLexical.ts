import {
    BoldFeature,
    ItalicFeature,
    LinkFeature,
    lexicalEditor,
    ParagraphFeature,
    UnderlineFeature,
} from '@payloadcms/richtext-lexical';
import type { Config } from 'payload';

export const lexicalLink = () =>
    LinkFeature({
        enabledCollections: ['pages', 'posts'],
        fields: ({ defaultFields }) => {
            const defaultFieldsWithoutUrl = defaultFields.filter((field) => {
                if ('name' in field && field.name === 'url') return false;
                return true;
            });

            return [
                ...defaultFieldsWithoutUrl,
                {
                    name: 'url',
                    type: 'text',
                    admin: {
                        condition: ({ linkType }) => linkType !== 'internal',
                    },
                    label: ({ t }) => t('fields:enterURL'),
                    required: true,
                    validate: (value: unknown, options: { siblingData?: { linkType?: string } }) => {
                        if (options?.siblingData?.linkType === 'internal') {
                            return true; // no validation needed, as no url should exist for internal links
                        }
                        return value ? true : 'URL is required';
                    },
                },
            ];
        },
    });

export const defaultLexical: Config['editor'] = lexicalEditor({
    features: () => {
        return [ParagraphFeature(), UnderlineFeature(), BoldFeature(), ItalicFeature(), lexicalLink()];
    },
});
