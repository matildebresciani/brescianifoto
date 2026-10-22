'use client';

import { motion, useReducedMotion } from 'motion/react';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import RichText from '@/components/molecules/admin/RichText';
import LightboxImage from '@/components/molecules/frontend/LightboxImage';
import LightboxPreloader from '@/components/molecules/frontend/LightboxPreloader';
import ModalDialog from '@/components/molecules/frontend/ModalDialog';
import Portal from '@/components/molecules/Portal';
import { type DeliveryTheme, themeStyle } from '@/lib/client-deliveries/shared';
import type { DeliveryBlock, DeliveryPhoto } from '@/lib/client-deliveries/view';
import { getLightboxImageKey, getLightboxImageSize, type LightboxViewport } from '@/lib/utilities/lightbox-images';
import type { Media } from '@/payload-types';

function DeliveryLightbox({
    photos,
    index,
    setIndex,
    close,
    theme,
}: {
    photos: DeliveryPhoto[];
    index: number;
    setIndex: (index: number) => void;
    close: () => void;
    theme: DeliveryTheme;
}) {
    const current = photos[index];
    const [viewport, setViewport] = useState<LightboxViewport | null>(null);
    const [readyKey, setReadyKey] = useState<string | null>(null);
    const measureViewport = useCallback((size: LightboxViewport) => {
        setViewport((previous) =>
            previous?.width === size.width && previous.height === size.height ? previous : size,
        );
    }, []);
    const items = useMemo(
        () =>
            photos.map(
                (photo): Media => ({
                    id: photo.id,
                    width: photo.width,
                    height: photo.height,
                    url: photo.src,
                    imageVersion: photo.imageVersion,
                    alt: photo.name,
                    createdAt: photo.createdAt,
                    updatedAt: photo.updatedAt,
                }),
            ),
        [photos],
    );
    const navigate = (offset: number) => setIndex((index + offset + photos.length) % photos.length);
    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                setIndex((index - 1 + photos.length) % photos.length);
            }
            if (event.key === 'ArrowRight') {
                event.preventDefault();
                setIndex((index + 1) % photos.length);
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [index, photos.length, setIndex]);
    if (!current) return null;
    const image = items[index];
    if (!image) return null;
    return (
        <Portal>
            <ModalDialog
                onClose={close}
                aria-label="Gallery photo viewer"
                style={themeStyle(theme)}
                className="delivery-lightbox modal--open fixed inset-0 z-50 flex flex-col bg-bg-base text-fg-base outline-none"
            >
                <div className="flex flex-wrap items-center justify-between gap-base p-base">
                    <p className="metadata">
                        {index + 1} / {photos.length}
                    </p>
                    <p className="body-sm max-w-[50%] break-words">{current.name}</p>
                    <button
                        type="button"
                        className="delivery-icon focus-ring"
                        onClick={close}
                        aria-label="Close photo viewer"
                    >
                        ×
                    </button>
                </div>
                <div className="flex min-h-0 flex-1 items-center gap-xs px-xs">
                    <LightboxImage
                        key={getLightboxImageKey(image)}
                        image={image}
                        onNavigate={navigate}
                        onViewportChange={measureViewport}
                        onReady={(size) => setReadyKey(`${getLightboxImageKey(image)}:${size}`)}
                    />
                </div>
                <div className="flex items-center justify-between gap-base p-base">
                    <button
                        type="button"
                        className="delivery-icon focus-ring"
                        aria-label="Previous photo"
                        disabled={photos.length < 2}
                        onClick={() => navigate(-1)}
                    >
                        ←
                    </button>
                    {current.downloadHref && (
                        <a className="delivery-outline ui-text focus-ring" href={current.downloadHref}>
                            Download original
                        </a>
                    )}
                    <button
                        type="button"
                        className="delivery-icon focus-ring"
                        aria-label="Next photo"
                        disabled={photos.length < 2}
                        onClick={() => navigate(1)}
                    >
                        →
                    </button>
                </div>
                <LightboxPreloader
                    items={items}
                    index={index}
                    viewport={viewport}
                    isCurrentReady={Boolean(
                        viewport &&
                            readyKey === `${getLightboxImageKey(image)}:${getLightboxImageSize(image, viewport)}`,
                    )}
                />
            </ModalDialog>
        </Portal>
    );
}

export function PhotoSection({ block }: { block: Extract<DeliveryBlock, { type: 'photos' }> }) {
    const [index, setIndex] = useState<number | null>(null);
    const shouldReduceMotion = useReducedMotion();
    return (
        <section
            id={block.anchor}
            tabIndex={-1}
            className={`delivery-section bg-bg-base text-fg-base outline-none${block.hasCustomColors ? ' delivery-section-custom' : ''}`}
            style={themeStyle(block.theme)}
            aria-labelledby={`${block.anchor}-title`}
        >
            <div className="flex flex-wrap items-baseline justify-between gap-base mb-xl">
                <h2 id={`${block.anchor}-title`} className="heading-2">
                    {block.title}
                </h2>
                <p className="metadata text-fg-subtle">{block.photos.length} photographs</p>
            </div>
            {block.introduction && (
                <div className="delivery-section-introduction">
                    <RichText data={block.introduction} enableGutter={false} />
                </div>
            )}
            <div className="delivery-photo-grid">
                {block.photos.map((photo, photoIndex) => (
                    <motion.figure
                        key={`${photo.id}-${photoIndex}`}
                        className="delivery-photo m-0"
                        initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.05 }}
                        transition={{
                            duration: shouldReduceMotion ? 0 : 0.6,
                            delay: shouldReduceMotion ? 0 : (photoIndex % 3) * 0.06,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                    >
                        <button
                            type="button"
                            className="group focus-ring-tight block w-full overflow-hidden bg-bg-subtle"
                            aria-label={`Open photo ${photoIndex + 1}: ${photo.name}`}
                            onClick={() => setIndex(photoIndex)}
                        >
                            <Image
                                src={photo.src}
                                alt={photo.name}
                                width={photo.width}
                                height={photo.height}
                                sizes="(min-width: 1024px) 32vw, 48vw"
                                loading="lazy"
                                className="h-auto w-full transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transform-none motion-reduce:transition-none"
                            />
                        </button>
                    </motion.figure>
                ))}
            </div>
            {index !== null && (
                <DeliveryLightbox
                    photos={block.photos}
                    index={index}
                    setIndex={setIndex}
                    close={() => setIndex(null)}
                    theme={block.theme}
                />
            )}
        </section>
    );
}
