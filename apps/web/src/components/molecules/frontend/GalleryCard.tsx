'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { ImageMedia } from '@/components/atoms/frontend/media/ImageMedia';
import type { Locale } from '@/i18n/localized-collections';
import { downUpToggle } from '@/lib/motion/motion-variants';
import { getGalleryCoverImage, payloadObject } from '@/lib/utilities/composables';
import { formatLinkByCollection } from '@/lib/utilities/format-link';
import type { Gallery } from '@/payload-types';
import Tag from './Tag';

type Props = {
    data: Gallery;
    locale: Locale;
    /** Off by default — the tag badge is built but not yet part of the card design. */
    showTag?: boolean;
};

const GalleryCard = ({ data, locale, showTag = false }: Props) => {
    const link = formatLinkByCollection(data.slug, 'galleries', locale);
    if (!link) return null;

    const cover = getGalleryCoverImage(data);
    const tag = data.tags?.map((item) => payloadObject(item)).filter((item) => item !== undefined)[0];

    return (
        <motion.div
            variants={downUpToggle}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
        >
            <Link
                href={link}
                className="focus-ring-tight group relative block aspect-4/5 w-full cursor-pointer overflow-hidden border border-border-base bg-bg-base"
            >
                {cover && (
                    <ImageMedia
                        resource={cover}
                        fill
                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.08]"
                        size="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
                    />
                )}

                {showTag && tag && <Tag tag={tag} locale={locale} className="absolute top-xs left-xs" />}

                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-linear-to-t from-bg-base/90 to-transparent" />

                <p className="heading-3 absolute inset-x-0 bottom-0 p-base text-fg-base transition-colors duration-300 group-hover:text-fg-highlight">
                    {data.title}
                </p>
            </Link>
        </motion.div>
    );
};

export default GalleryCard;
