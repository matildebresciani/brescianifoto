import { createBlock } from '@/lib/block-templates/block';
import { payloadHeadingCollection } from '@/lib/field-templates/headings';
import { payloadLink } from '@/lib/field-templates/links';

export const Hero = createBlock('hero', {
    interfaceName: 'Hero',
    labels: {
        singular: 'Hero',
        plural: 'Heros',
    },
    fields: [...payloadHeadingCollection, payloadLink()],
});
