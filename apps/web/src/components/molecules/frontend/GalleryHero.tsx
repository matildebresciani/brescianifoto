'use client';

import { motion, useReducedMotion } from 'motion/react';
import { downUpToggle } from '@/lib/motion/motion-variants';
import { formatGalleryMetadata } from '@/lib/utilities/gallery-metadata';
import type { Gallery } from '@/payload-types';

type Props = {
    data: Gallery;
};

const GalleryHero = ({ data }: Props) => {
    const shouldReduceMotion = useReducedMotion();
    return (
        <section className="w-full bg-bg-base">
            <motion.div
                variants={downUpToggle}
                animate={shouldReduceMotion ? { opacity: 1, y: 0 } : undefined}
                initial={shouldReduceMotion ? false : 'hidden'}
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.6, ease: 'easeOut' }}
                className="base-block flex flex-col gap-base py-lg motion-reduce:transform-none! motion-reduce:opacity-100!"
            >
                <h1 className="heading-1 text-fg-base">{data.title}</h1>

                <p className="metadata">{formatGalleryMetadata(data)}</p>
            </motion.div>
        </section>
    );
};

export default GalleryHero;
