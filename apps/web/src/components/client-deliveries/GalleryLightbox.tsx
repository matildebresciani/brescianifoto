'use client';

import { Download } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { createContext, type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import Close from '@/components/atoms/frontend/buttons/Close';
import ArrowIcon from '@/components/atoms/frontend/icons/ArrowIcon';
import LightboxPreloader from '@/components/molecules/frontend/LightboxPreloader';
import LightboxThumbnails from '@/components/molecules/frontend/LightboxThumbnails';
import ModalDialog from '@/components/molecules/frontend/ModalDialog';
import Portal from '@/components/molecules/Portal';
import { type DeliveryTheme, themeStyle } from '@/lib/client-deliveries/shared';
import type { DeliveryPhoto } from '@/lib/client-deliveries/view';
import { getLightboxImageKey, getLightboxImageSize, type LightboxViewport } from '@/lib/utilities/lightbox-images';
import type { Media } from '@/payload-types';
import { GalleryLightboxStage } from './GalleryLightboxStage';

/** Lets photo sections open the same viewer without moving server-rendered content into the client bundle. */
export const GalleryLightboxContext = createContext<((photo: DeliveryPhoto, theme: DeliveryTheme) => void) | null>(
    null,
);

/** Shares one ordered photo sequence across all sections, retaining the opening section's colors. */
export function GalleryLightbox({ photos, children }: { photos: DeliveryPhoto[]; children: ReactNode }) {
    const items = useMemo(() => [...new Map(photos.map((photo) => [photo.id, photo])).values()], [photos]);
    const [viewer, setViewer] = useState<{ index: number; theme: DeliveryTheme } | null>(null);
    const openPhoto = useCallback(
        (photo: DeliveryPhoto, theme: DeliveryTheme) => {
            const index = items.findIndex((item) => item.id === photo.id);
            if (index >= 0) setViewer({ index, theme });
        },
        [items],
    );
    const navigate = useCallback((index: number) => {
        setViewer((current) => (current ? { ...current, index } : null));
    }, []);
    const close = useCallback(() => setViewer(null), []);

    return (
        <GalleryLightboxContext.Provider value={openPhoto}>
            {children}
            <AnimatePresence>
                {viewer && (
                    <DeliveryLightbox
                        photos={items}
                        index={viewer.index}
                        setIndex={navigate}
                        close={close}
                        theme={viewer.theme}
                    />
                )}
            </AnimatePresence>
        </GalleryLightboxContext.Provider>
    );
}

const arrowClasses =
    'delivery-lightbox-control focus-ring-tight hidden size-12 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border-base bg-transparent text-fg-base md:flex';

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
                shouldAnimate
                aria-label="Gallery photo viewer"
                style={themeStyle(theme)}
                className="delivery-lightbox modal--open fixed inset-0 z-50 flex flex-col bg-bg-base text-fg-base outline-none"
            >
                <div className="flex shrink-0 items-center justify-between gap-base p-base">
                    <p className="metadata">
                        {index + 1} / {photos.length}
                    </p>
                    <div className="flex items-center gap-xs">
                        {current.downloadHref && (
                            <a
                                className="delivery-lightbox-control focus-ring-tight inline-flex size-12 shrink-0 items-center justify-center rounded-full border border-border-base bg-transparent p-0 text-fg-base"
                                href={current.downloadHref}
                                aria-label="Download original"
                                title="Download original"
                            >
                                <Download size={20} strokeWidth={1.25} aria-hidden="true" />
                            </a>
                        )}
                        <Close
                            onClick={close}
                            className="delivery-lightbox-control size-12 rounded-full border border-border-base hover:text-fg-base"
                        />
                    </div>
                </div>
                <div className="flex min-h-0 flex-1 items-center gap-xs px-xs">
                    {photos.length > 1 && (
                        <button
                            type="button"
                            className={arrowClasses}
                            aria-label="Previous photo"
                            title="Previous photo"
                            onClick={() => navigate(-1)}
                        >
                            <ArrowIcon className="rotate-180" />
                        </button>
                    )}
                    <GalleryLightboxStage
                        image={image}
                        onNavigate={navigate}
                        onViewportChange={measureViewport}
                        onReady={(size) => setReadyKey(`${getLightboxImageKey(image)}:${size}`)}
                    />
                    {photos.length > 1 && (
                        <button
                            type="button"
                            className={arrowClasses}
                            aria-label="Next photo"
                            title="Next photo"
                            onClick={() => navigate(1)}
                        >
                            <ArrowIcon />
                        </button>
                    )}
                </div>
                {photos.length > 1 && <LightboxThumbnails items={items} index={index} onNavigate={setIndex} />}
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
