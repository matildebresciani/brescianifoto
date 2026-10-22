import {
    FixedToolbarFeature,
    HeadingFeature,
    LinkFeature,
    lexicalEditor,
    TextStateFeature,
} from '@payloadcms/richtext-lexical';

/** Keep Payload's feature initialization and validation while supplying a scoped typography preview. */
export const deliveryEditor = (): ReturnType<typeof lexicalEditor> => async (args) => {
    const editor = await lexicalEditor({
        features: ({ defaultFeatures }) => [
            ...defaultFeatures.filter(({ key }) => !['heading', 'link', 'relationship', 'upload'].includes(key)),
            HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
            LinkFeature({ enabledCollections: [] }),
            TextStateFeature({
                state: {
                    deliveryStyle: {
                        metadata: {
                            label: 'Metadata',
                            css: {},
                        },
                    },
                },
            }),
            FixedToolbarFeature(),
        ],
    })(args);

    const fieldComponent = '@/components/molecules/admin/client-deliveries/DeliveryRichTextField#DeliveryRichTextField';
    return {
        ...editor,
        FieldComponent: fieldComponent,
        generateImportMap: (options) => {
            editor.generateImportMap?.(options);
            options.addToImportMap(fieldComponent);
        },
    };
};
