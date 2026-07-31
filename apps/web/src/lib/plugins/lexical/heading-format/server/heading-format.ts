import { createServerFeature } from '@payloadcms/richtext-lexical';

export const HeadingFormatFeature = createServerFeature({
    feature: {
        ClientFeature: '@/lib/plugins/lexical/heading-format/client/heading-format#HeadingFormatFeatureClient',
        clientFeatureProps: null,
        i18n: {
            da: {
                placeholder: 'Style din heading',
            },
            en: {
                placeholder: 'Style your heading',
            },
        },
    },
    key: 'heading-format',
});
