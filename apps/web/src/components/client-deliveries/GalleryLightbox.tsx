'use client';

import { Download } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { createContext, type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import Close from '@/components/atoms/frontend/buttons/Close';
import ArrowIcon from '@/components/atoms/frontend/icons/ArrowIcon';
import LightboxPreloader from '@/components/molecules/frontend/LightboxPreloader';
import { LightboxStage } from '@/components/molecules/frontend/LightboxStage';
import LightboxThumbnails from '@/components/molecules/frontend/LightboxThumbnails';
import ModalDialog from '@/components/molecules/frontend/ModalDialog';
import Portal from '@/components/molecules/Portal';
import { themeDefaults, themeStyle } from '@/lib/client-deliveries/shared';
import type { DeliveryPhoto } from '@/lib/client-deliveries/view';
import { getLightboxImageKey, getLightboxImageSize, type LightboxViewport } from '@/lib/utilities/lightbox-images';
import type { Media } from '@/payload-types';

/** Lets photo sections open the same viewer without moving server-rendered content into the client bundle. */
export const GalleryLightboxContext = createContext<((photo: DeliveryPhoto) => void) | null>(null);

/** Shares one ordered sequence and a neutral viewing surface across all gallery sections. */
export function GalleryLightbox({ photos, children }: { photos: DeliveryPhoto[]; children: ReactNode }) {
    const items = useMemo(() => [...new Map(photos.map((photo) => [photo.id, photo])).values()], [photos]);
    const [viewerIndex, setViewerIndex] = useState<number | null>(null);
    const openPhoto = useCallback(
        (photo: DeliveryPhoto) => {
            const index = items.findIndex((item) => item.id === photo.id);
            if (index >= 0) setViewerIndex(index);
        },
        [items],
    );
    const close = useCallback(() => setViewerIndex(null), []);

    return (
        <GalleryLightboxContext.Provider value={openPhoto}>
            {children}
            <AnimatePresence>
                {viewerIndex !== null && (
                    <DeliveryLightbox photos={items} index={viewerIndex} setIndex={setViewerIndex} close={close} />
                )}
            </AnimatePresence>
        </GalleryLightboxContext.Provider>
    );
}

const arrowClasses =
    'delivery-lightbox-control focus-ring-tight hidden size-12 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border-base bg-transparent text-fg-base md:flex';

const mobileArrowClasses =
    'delivery-lightbox-control focus-ring-tight inline-flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border-base bg-transparent text-fg-base';
const imageLabels = {
    zoomIn: 'Zoom ind',
    zoomOut: 'Zoom ud',
    viewer: 'Billedvisning',
    loading: 'Indlæser billede',
    error: 'Billedet kunne ikke indlæses.',
    retry: 'Prøv igen',
};
const thumbnailLabels = { group: 'Miniaturer', photo: 'Billede', goToPhoto: 'Gå til billede' };

function DeliveryLightbox({
    photos,
    index,
    setIndex,
    close,
}: {
    photos: DeliveryPhoto[];
    index: number;
    setIndex: (index: number) => void;
    close: () => void;
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
                aria-label="Billedvisning"
                style={themeStyle(themeDefaults)}
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
                                aria-label="Download originalbillede"
                                title="Download originalbillede"
                            >
                                <Download size={20} strokeWidth={1.25} aria-hidden="true" />
                            </a>
                        )}
                        <Close
                            label="Luk billedvisning"
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
                            aria-label="Forrige billede"
                            title="Forrige billede"
                            onClick={() => navigate(-1)}
                        >
                            <ArrowIcon className="rotate-180" />
                        </button>
                    )}
                    <LightboxStage
                        image={image}
                        labels={imageLabels}
                        onNavigate={navigate}
                        onViewportChange={measureViewport}
                        onReady={(size) => setReadyKey(`${getLightboxImageKey(image)}:${size}`)}
                    />
                    {photos.length > 1 && (
                        <button
                            type="button"
                            className={arrowClasses}
                            aria-label="Næste billede"
                            title="Næste billede"
                            onClick={() => navigate(1)}
                        >
                            <ArrowIcon />
                        </button>
                    )}
                </div>
                {photos.length > 1 && (
                    <>
                        <div className="flex shrink-0 items-center justify-center gap-base px-base py-xs md:hidden">
                            <button
                                type="button"
                                className={mobileArrowClasses}
                                aria-label="Forrige billede"
                                onClick={() => navigate(-1)}
                            >
                                <ArrowIcon className="rotate-180" />
                            </button>
                            <p className="body-xs">Stryg for at se flere</p>
                            <button
                                type="button"
                                className={mobileArrowClasses}
                                aria-label="Næste billede"
                                onClick={() => navigate(1)}
                            >
                                <ArrowIcon />
                            </button>
                        </div>
                        <LightboxThumbnails
                            items={items}
                            index={index}
                            onNavigate={setIndex}
                            labels={thumbnailLabels}
                        />
                    </>
                )}
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
