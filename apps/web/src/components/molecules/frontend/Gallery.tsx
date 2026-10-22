'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useCallback, useState, useSyncExternalStore } from 'react';
import { ImageMedia } from '@/components/atoms/frontend/media/ImageMedia';
import { cssVariables } from '@/cssVariables';
import { downUpToggle } from '@/lib/motion/motion-variants';
import { payloadObject } from '@/lib/utilities/composables';
import { type GalleryLayoutMeasurements, getGalleryColumns } from '@/lib/utilities/gallery-columns';
import { galleryImageSizes } from '@/lib/utilities/portfolio-image-sizes';
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
    const [measurements, setMeasurements] = useState<GalleryLayoutMeasurements>({ columnWidth: 1, gap: 0 });
    const measureGallery = useCallback(
        (element: HTMLDivElement | null) => {
            if (!element) return;

            const measure = () => {
                const styles = window.getComputedStyle(element);
                const columnGap = Number.parseFloat(styles.columnGap) || 0;
                const gap = Number.parseFloat(styles.rowGap) || 0;
                const contentWidth =
                    element.clientWidth -
                    (Number.parseFloat(styles.paddingLeft) || 0) -
                    (Number.parseFloat(styles.paddingRight) || 0);
                const columnWidth = (contentWidth - columnGap * (columnCount - 1)) / columnCount;
                if (columnWidth <= 0) return;

                setMeasurements((previous) =>
                    previous.columnWidth === columnWidth && previous.gap === gap ? previous : { columnWidth, gap },
                );
            };

            measure();
            const observer = new ResizeObserver(measure);
            observer.observe(element);
            // A responsive gap can change even when the gallery's container width stays fixed.
            window.addEventListener('resize', measure);
            return () => {
                observer.disconnect();
                window.removeEventListener('resize', measure);
            };
        },
        [columnCount],
    );

    if (!items?.length) return null;

    return (
        <div
            ref={measureGallery}
            className={cn(
                'grid items-start gap-xs md:gap-base',
                columnCount === 3 ? 'grid-cols-3' : 'grid-cols-2',
                className,
            )}
        >
            {getGalleryColumns(items, columnCount, measurements).map((column, columnIndex) => (
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
                                transition={{
                                    duration: shouldReduceMotion ? 0 : 0.6,
                                    delay: shouldReduceMotion ? 0 : columnIndex * 0.06,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                            >
                                <button
                                    type="button"
                                    className="focus-ring-tight group block w-full cursor-pointer overflow-hidden bg-bg-subtle text-left"
                                    aria-label={`Open photo ${index + 1} of ${items.length}${item.alt ? `: ${item.alt}` : ''}`}
                                    style={{
                                        aspectRatio:
                                            item.width && item.height ? `${item.width} / ${item.height}` : undefined,
                                    }}
                                    onClick={() => setLightboxIndex(index)}
                                >
                                    <ImageMedia
                                        resource={item}
                                        className="w-full h-auto align-bottom transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transform-none motion-reduce:transition-none"
                                        size={galleryImageSizes}
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
