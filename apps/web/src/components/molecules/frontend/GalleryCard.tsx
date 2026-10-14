'use client';

import { motion, useReducedMotion } from 'motion/react';
import Link from 'next/link';
import { ImageMedia } from '@/components/atoms/frontend/media/ImageMedia';
import type { Locale } from '@/i18n/localized-collections';
import { downUpToggle } from '@/lib/motion/motion-variants';
import { getGalleryCoverImage, payloadObject } from '@/lib/utilities/composables';
import { formatLinkByCollection } from '@/lib/utilities/format-link';
import { formatGalleryCardCaption } from '@/lib/utilities/gallery-metadata';
import type { Gallery } from '@/payload-types';
import Tag from './Tag';

type Props = {
    data: Gallery;
    locale: Locale;
    /** Displays an optional tag link separately from the gallery links. */
    showTag?: boolean;
};

const GalleryCard = ({ data, locale, showTag = false }: Props) => {
    const shouldReduceMotion = useReducedMotion();
    const link = formatLinkByCollection(data.slug, 'galleries', locale);
    if (!link) return null;

    const cover = getGalleryCoverImage(data);
    const tag = data.tags?.map((item) => payloadObject(item)).filter((item) => item !== undefined)[0];

    return (
        <motion.div
            className="motion-reduce:transform-none! motion-reduce:opacity-100!"
            variants={downUpToggle}
            animate={shouldReduceMotion ? { opacity: 1, y: 0 } : undefined}
            initial={shouldReduceMotion ? false : 'hidden'}
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.6, ease: 'easeOut' }}
        >
            <figure>
                <Link href={link} className="focus-ring-tight group block">
                    <div className="relative aspect-4/5 w-full overflow-hidden bg-bg-subtle">
                        {cover && (
                            <ImageMedia
                                resource={cover}
                                fill
                                className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transform-none motion-reduce:transition-none"
                                size="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
                            />
                        )}
                    </div>
                </Link>
                <figcaption className="mt-md">
                    <Link href={link} className="focus-ring-tight block">
                        <p className="metadata">{formatGalleryCardCaption(data)}</p>
                    </Link>
                    {showTag && tag && <Tag tag={tag} locale={locale} className="mt-xs" />}
                </figcaption>
            </figure>
        </motion.div>
    );
};

export default GalleryCard;
