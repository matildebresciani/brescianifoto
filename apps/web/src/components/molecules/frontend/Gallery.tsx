'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useState, useSyncExternalStore } from 'react';
import { ImageMedia } from '@/components/atoms/frontend/media/ImageMedia';
import { cssVariables } from '@/cssVariables';
import { downUpToggle } from '@/lib/motion/motion-variants';
import { payloadObject } from '@/lib/utilities/composables';
import { getGalleryColumns } from '@/lib/utilities/gallery-columns';
import { cn } from '@/lib/utilities/ui';
import type { Media } from '@/payload-types';
import Lightbox from './Lightbox';

type Props = {
    images: (string | Media)[] | null | undefined;
    className?: string;
    /** Number of leading images treated as above the fold: eagerly loaded with high fetch priority instead of lazy-loaded. */
    priorityCount?: number;
};

const desktopQuery = `(min-width: ${cssVariables.breakpoints.lg}px)`;

function subscribeToColumnCount(onChange: () => void) {
    const query = window.matchMedia(desktopQuery);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
}

function getColumnCount(): 2 | 3 {
    return window.matchMedia(desktopQuery).matches ? 3 : 2;
}

function getServerColumnCount(): 2 | 3 {
    return 2;
}

const Gallery = ({ images, className, priorityCount = 3 }: Props) => {
    const items = images?.map((item) => payloadObject(item)).filter((item) => item !== undefined);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const columnCount = useSyncExternalStore(subscribeToColumnCount, getColumnCount, getServerColumnCount);
    const shouldReduceMotion = useReducedMotion();

    if (!items?.length) return null;

    return (
        <div
            className={cn(
                'grid items-start gap-xs md:gap-base',
                columnCount === 3 ? 'grid-cols-3' : 'grid-cols-2',
                className,
            )}
        >
            {getGalleryColumns(items, columnCount).map((column) => (
                <div key={column.id} className="flex min-w-0 flex-col gap-xs md:gap-base">
                    {column.items.map(({ item, index }) => {
                        const isAboveFold = index < priorityCount;

                        return (
                            <motion.figure
                                key={item.id}
                                className="m-0 w-full motion-reduce:transform-none! motion-reduce:opacity-100!"
                                variants={downUpToggle}
                                initial={shouldReduceMotion ? false : 'hidden'}
                                animate={shouldReduceMotion ? { opacity: 1, y: 0 } : undefined}
                                whileInView="visible"
                                viewport={{ once: true, amount: 0.2 }}
                                transition={{ duration: 0.6, ease: 'easeOut' }}
                            >
                                <button
                                    type="button"
                                    className="group block w-full cursor-pointer overflow-hidden bg-bg-subtle text-left"
                                    style={{
                                        aspectRatio:
                                            item.width && item.height ? `${item.width} / ${item.height}` : undefined,
                                    }}
                                    onClick={() => setLightboxIndex(index)}
                                >
                                    <ImageMedia
                                        resource={item}
                                        className="w-full h-auto align-bottom transition-opacity duration-300 ease-out group-hover:opacity-80"
                                        size={`(min-width: ${cssVariables.breakpoints.lg}px) 33vw, 50vw`}
                                        priority={isAboveFold}
                                        fetchPriority={isAboveFold ? 'high' : undefined}
                                    />
                                </button>
                            </motion.figure>
                        );
                    })}
                </div>
            ))}

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
