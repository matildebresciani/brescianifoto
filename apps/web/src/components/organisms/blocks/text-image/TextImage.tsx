import PayloadLink from '@/components/atoms/frontend/links/PayloadLink';
import { ImageMedia } from '@/components/atoms/frontend/media/ImageMedia';
import RichText from '@/components/molecules/admin/RichText';
import type { BC } from '@/lib/types/block-props';
import { cn } from '@/lib/utilities/ui';
import type { TextImage as TextImageProps } from '@/payload-types';
import BaseBlock from '../base-block/BaseBlock';

const TextImageBlock: BC<TextImageProps> = ({ block, locale }) => {
    const { order, image, richText, addLink, link } = block;

    return (
        <BaseBlock>
            <div className="oakgrid">
                <div
                    className={cn(
                        'col-span-12 relative min-h-[400px] max-h-[600px] lg:sticky top-6 lg:col-span-6 lg:min-h-[500px] xl:col-span-5',
                        order === 'image-right' && 'xl:col-start-8',
                    )}
                >
                    <ImageMedia resource={image} className="object-cover absolute h-full w-full rounded-2xl" />
                </div>
                <div
                    className={cn(
                        'col-span-12 py-16 lg:col-span-6',
                        order === 'image-right' && 'lg:order-first',
                        order === 'image-left' && 'xl:col-start-7 xl:col-span-5',
                    )}
                >
                    {richText && <RichText data={richText} />}
                    {addLink && <PayloadLink link={link} locale={locale} className="md:mt-10" />}
                </div>
            </div>
        </BaseBlock>
    );
};

export default TextImageBlock;
