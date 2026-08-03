import Gallery from '@/components/molecules/frontend/Gallery';
import type { BC } from '@/lib/types/block-props';
import type { Gallery as GalleryProps } from '@/payload-types';
import BaseBlock from '../base-block/BaseBlock';

const GalleryBlock: BC<GalleryProps> = ({ block }) => {
    return (
        <BaseBlock>
            <Gallery images={block.gallery} />
        </BaseBlock>
    );
};

export default GalleryBlock;
