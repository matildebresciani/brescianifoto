import Link from 'next/link';
import { ImageMedia } from '@/components/atoms/frontend/media/ImageMedia';
import RichText from '@/components/molecules/admin/RichText';
import type { BC } from '@/lib/types/block-props';
import { getLinkTarget } from '@/lib/utilities/composables';
import { formatLink } from '@/lib/utilities/format-link';
import { cn } from '@/lib/utilities/ui';
import type { TextImage as TextImageProps } from '@/payload-types';
import BaseBlock from '../base-block/BaseBlock';

const TextImageBlock: BC<TextImageProps> = ({ block, locale }) => {
    const { order, image, richText, addLink, link } = block;
    const href = formatLink(link, locale);

    return (
        <BaseBlock>
            <div className="grid items-center gap-lg lg:grid-cols-2 lg:gap-xl">
                <div
                    className={cn(
                        'relative aspect-4/5 w-full overflow-hidden bg-bg-subtle',
                        order === 'image-right' && 'lg:col-start-2 lg:row-start-1',
                    )}
                >
                    <ImageMedia resource={image} fill className="object-cover" size="(min-width: 1024px) 50vw, 100vw" />
                </div>
                <div className={cn('min-w-0', order === 'image-right' && 'lg:order-first')}>
                    {richText && <RichText data={richText} enableGutter={false} />}
                    {addLink && href && (
                        <Link
                            href={href}
                            target={getLinkTarget(link)}
                            className="focus-ring ui-text mt-md inline-block underline underline-offset-4"
                        >
                            {link?.label}
                        </Link>
                    )}
                </div>
            </div>
        </BaseBlock>
    );
};

export default TextImageBlock;
