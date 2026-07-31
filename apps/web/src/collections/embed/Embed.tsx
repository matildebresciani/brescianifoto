import type { BC } from '@/lib/types/block-props';
import type { Embed as EmbedProps } from '@/payload-types';

const EmbedBlock: BC<EmbedProps> = ({ block }) => {
    const { embedCode } = block;

    if (!embedCode) return null;

    // biome-ignore lint: react/no-danger
    return <div dangerouslySetInnerHTML={{ __html: embedCode }} />;
};

export default EmbedBlock;
