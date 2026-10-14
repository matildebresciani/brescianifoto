'use client';

import { motion, useReducedMotion } from 'motion/react';
import type { Locale } from '@/i18n/localized-collections';
import { downUpToggle } from '@/lib/motion/motion-variants';
import { payloadObject } from '@/lib/utilities/composables';
import { formatGalleryMetadata } from '@/lib/utilities/gallery-metadata';
import type { Gallery } from '@/payload-types';
import Tag from './Tag';

type Props = {
    data: Gallery;
    locale: Locale;
};

const GalleryHero = ({ data, locale }: Props) => {
    const shouldReduceMotion = useReducedMotion();
    const tags = data.tags?.map((item) => payloadObject(item)).filter((item) => item !== undefined) ?? [];
    return (
        <section className="w-full bg-bg-base">
            <motion.div
                variants={downUpToggle}
                animate={shouldReduceMotion ? { opacity: 1, y: 0 } : undefined}
                initial={shouldReduceMotion ? false : 'hidden'}
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.6, ease: 'easeOut' }}
                className="base-block flex flex-col gap-md py-xl motion-reduce:transform-none! motion-reduce:opacity-100!"
            >
                {tags.length > 0 && (
                    <div className="flex flex-wrap gap-xs">
                        {tags.map((tag) => (
                            <Tag key={tag.id} tag={tag} locale={locale} />
                        ))}
                    </div>
                )}

                <h1 className="heading-1 text-fg-base">{data.title}</h1>

                <p className="metadata">{formatGalleryMetadata(data)}</p>
            </motion.div>
        </section>
    );
};

export default GalleryHero;
