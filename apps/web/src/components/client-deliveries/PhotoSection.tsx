'use client';

import { motion, useReducedMotion } from 'motion/react';
import Image from 'next/image';
import { type CSSProperties, useCallback, useContext, useMemo, useState } from 'react';
import RichText from '@/components/molecules/admin/RichText';
import {
    getPhotoImageSize,
    getPhotoMasonry,
    type PhotoMasonryMeasurements,
} from '@/lib/client-deliveries/photo-masonry';
import { themeStyle } from '@/lib/client-deliveries/shared';
import type { DeliveryBlock, PhotoSpacing } from '@/lib/client-deliveries/view';
import { GalleryLightboxContext } from './GalleryLightbox';

export function PhotoSection({
    block,
    desktopColumns = 4,
    photoSpacing = 2,
    shouldInheritTheme = false,
}: {
    block: Extract<DeliveryBlock, { type: 'photos' }>;
    desktopColumns?: 3 | 4;
    photoSpacing?: PhotoSpacing;
    shouldInheritTheme?: boolean;
}) {
    const openPhoto = useContext(GalleryLightboxContext);
    const shouldReduceMotion = useReducedMotion();
    const [measurements, setMeasurements] = useState<PhotoMasonryMeasurements | null>(null);
    const measureGrid = useCallback(
        (element: HTMLDivElement | null) => {
            if (!element) return;
            const measure = () => {
                const styles = window.getComputedStyle(element);
                const width = element.getBoundingClientRect().width;
                const gap = photoSpacing;
                const columns = Math.min(
                    Number.parseInt(styles.getPropertyValue('--delivery-photo-columns'), 10),
                    desktopColumns,
                );
                const landscapeRatio = Number.parseFloat(styles.getPropertyValue('--delivery-photo-landscape-ratio'));
                const portraitRatio = Number.parseFloat(styles.getPropertyValue('--delivery-photo-portrait-ratio'));
                if (width <= 0) return;
                setMeasurements((previous) =>
                    previous?.width === width &&
                    previous.gap === gap &&
                    previous.columns === columns &&
                    previous.landscapeRatio === landscapeRatio &&
                    previous.portraitRatio === portraitRatio
                        ? previous
                        : { width, gap, columns, landscapeRatio, portraitRatio },
                );
            };
            measure();
            const observer = new ResizeObserver(measure);
            observer.observe(element);
            // Breakpoints can change the column count without changing a constrained container's width.
            window.addEventListener('resize', measure);
            return () => {
                observer.disconnect();
                window.removeEventListener('resize', measure);
            };
        },
        [desktopColumns, photoSpacing],
    );
    const layout = useMemo(
        () => (measurements ? getPhotoMasonry(block.photos, measurements) : null),
        [block.photos, measurements],
    );
    const sectionStyle: CSSProperties & Record<string, string> = shouldInheritTheme ? {} : themeStyle(block.theme);
    sectionStyle['--delivery-photo-desktop-columns'] = String(desktopColumns);
    sectionStyle['--delivery-photo-spacing'] = `${photoSpacing}px`;
    return (
        <section
            id={block.anchor}
            tabIndex={-1}
            className={`delivery-section text-fg-base outline-none${shouldInheritTheme ? '' : ' bg-bg-base'}`}
            style={sectionStyle}
            aria-label={block.menuLabel}
        >
            <div className="delivery-section-inner">
                {block.introduction && (
                    <div className="delivery-section-introduction">
                        <RichText data={block.introduction} enableGutter={false} isDelivery />
                    </div>
                )}
                <div
                    ref={measureGrid}
                    className="delivery-photo-grid relative grid grid-cols-[repeat(var(--delivery-photo-columns),minmax(0,1fr))] gap-(--delivery-photo-gap)"
                    style={{ height: layout?.height }}
                >
                    {block.photos.map((photo, photoIndex) => {
                        const tile = layout?.tiles[photoIndex];
                        return (
                            <motion.figure
                                key={`${photo.id}-${photoIndex}`}
                                className="delivery-photo m-0 min-w-0"
                                style={{
                                    position: tile ? 'absolute' : undefined,
                                    left: tile?.left,
                                    top: tile?.top,
                                    width: tile?.width,
                                    height: tile?.height,
                                    aspectRatio:
                                        photo.width < photo.height
                                            ? 'var(--delivery-photo-portrait-ratio)'
                                            : 'var(--delivery-photo-landscape-ratio)',
                                }}
                                // The reduced-motion media rule supplies the static state before hydration too.
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.05 }}
                                transition={{
                                    duration: shouldReduceMotion ? 0 : 0.6,
                                    delay: shouldReduceMotion ? 0 : (tile?.column ?? 0) * 0.06,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                            >
                                <button
                                    type="button"
                                    className="group focus-ring-tight block h-full w-full overflow-hidden bg-bg-subtle"
                                    aria-label={`Åbn billede ${photoIndex + 1}: ${photo.name}`}
                                    onClick={() => openPhoto?.(photo)}
                                >
                                    <Image
                                        src={photo.src}
                                        alt={photo.name}
                                        width={photo.width}
                                        height={photo.height}
                                        quality={90}
                                        sizes={
                                            tile
                                                ? getPhotoImageSize(photo, tile)
                                                : `(min-width: 1280px) ${desktopColumns === 3 ? '33vw' : '25vw'}, (min-width: 768px) 33vw, 50vw`
                                        }
                                        loading="lazy"
                                        className="block h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.03] motion-reduce:transform-none motion-reduce:transition-none"
                                    />
                                </button>
                            </motion.figure>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
