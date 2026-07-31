import { createBlock } from '@/lib/block-templates/block';
import { payloadRichText } from '@/lib/field-templates/rich-text';

export const Paragraph = createBlock('paragraph', {
    interfaceName: 'Paragraph',
    labels: {
        singular: 'Paragraph',
        plural: 'Paragraphs',
    },
    fields: [payloadRichText()],
});
