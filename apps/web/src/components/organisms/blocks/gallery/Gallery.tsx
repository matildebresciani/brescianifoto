import Gallery from '@/components/molecules/frontend/Gallery';
import { defaultLocale } from '@/i18n/localized-collections';
import { initPayload } from '@/lib/config';
import { getAutomaticGalleryMix } from '@/lib/data/payload/get-automatic-gallery-mix';
import type { BC } from '@/lib/types/block-props';
import type { GalleryBlock as GalleryProps } from '@/payload-types';
import BaseBlock from '../base-block/BaseBlock';

const GalleryBlock: BC<GalleryProps> = async ({ block, locale = defaultLocale }) => {
    const selection =
        typeof block.photoSelection === 'string'
            ? await (await initPayload()).findByID({
                  collection: 'photo-selections',
                  id: block.photoSelection,
                  depth: 1,
                  overrideAccess: false,
                  disableErrors: true,
              })
            : block.photoSelection;
    const source = selection ?? block;
    const images =
        source.selectionMode !== 'random' && source.gallery?.length
            ? source.gallery
            : await getAutomaticGalleryMix(locale);
    if (!images.length) return null;
    return (
        <BaseBlock classNameOuter="pt-lg md:pt-xl">
            <Gallery images={images} />
        </BaseBlock>
    );
};

export default GalleryBlock;
