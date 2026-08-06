'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { ImageMedia } from '@/components/atoms/frontend/media/ImageMedia';
import type { Locale } from '@/i18n/localized-collections';
import { downUpToggle } from '@/lib/motion/motion-variants';
import { payloadObject } from '@/lib/utilities/composables';
import { formatLinkByCollection } from '@/lib/utilities/format-link';
// Note: the generated type for the Galleries collection is named `Gallery1` due to a
// name collision with the page-builder `Gallery` block (see payload-types.ts).
import type { Gallery1 } from '@/payload-types';

type Props = {
    data: Gallery1;
    locale: Locale;
};

const GalleryCard = ({ data, locale }: Props) => {
    const link = formatLinkByCollection(data.slug, 'galleries', locale);
    if (!link) return null;

    const cover = payloadObject(data.contentMeta?.featuredImage) ?? payloadObject(data.gallery[0]);
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

                {tag && (
                    <span className="eyebrow absolute top-xs left-xs border border-border-base bg-bg-base/60 px-xs py-micro text-fg-subtle">
                        {tag.tag}
                    </span>
                )}

                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-linear-to-t from-bg-base/90 to-transparent" />

                <p className="heading-3 absolute inset-x-0 bottom-0 p-base text-fg-base transition-colors duration-300 group-hover:text-fg-highlight">
                    {data.title}
                </p>
            </Link>
        </motion.div>
    );
};

export default GalleryCard;
