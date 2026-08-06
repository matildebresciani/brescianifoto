'use client';

import { motion } from 'motion/react';
import { useState } from 'react';
import { ImageMedia } from '@/components/atoms/frontend/media/ImageMedia';
import { downUpToggle } from '@/lib/motion/motion-variants';
import { payloadObject } from '@/lib/utilities/composables';
import { cn } from '@/lib/utilities/ui';
import type { Media } from '@/payload-types';
import Lightbox from './Lightbox';

type Props = {
    images: (string | Media)[] | null | undefined;
    className?: string;
    /** Number of leading images treated as above the fold: eagerly loaded with high fetch priority instead of lazy-loaded. */
    priorityCount?: number;
};

const Gallery = ({ images, className, priorityCount = 3 }: Props) => {
    const items = images?.map((item) => payloadObject(item)).filter((item) => item !== undefined);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    if (!items?.length) return null;

    return (
        <div className={cn('columns-2 gap-base lg:columns-3', className)}>
            {items.map((item, index) => {
                const isAboveFold = index < priorityCount;

                return (
                    <motion.figure
                        key={item.id}
                        className="mb-base break-inside-avoid"
                        variants={downUpToggle}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                    >
                        <button
                            type="button"
                            className="group block w-full cursor-pointer text-left"
                            onClick={() => setLightboxIndex(index)}
                        >
                            <ImageMedia
                                resource={item}
                                className="w-full h-auto align-bottom transition-opacity duration-300 ease-out group-hover:opacity-80"
                                size="(max-width: 1024px) 50vw, 33vw"
                                priority={isAboveFold}
                                fetchPriority={isAboveFold ? 'high' : undefined}
                            />
                        </button>
                    </motion.figure>
                );
            })}

            {lightboxIndex !== null && (
                <Lightbox
                    items={items}
                    index={lightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                    onNavigate={setLightboxIndex}
                />
            )}
        </div>
    );
};

export default Gallery;
