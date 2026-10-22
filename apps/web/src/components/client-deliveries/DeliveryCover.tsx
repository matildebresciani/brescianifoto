'use client';

import Image from 'next/image';
import { useCallback, useState } from 'react';
import { getPhotoImageSize } from '@/lib/client-deliveries/photo-masonry';
import type { DeliveryPhoto } from '@/lib/client-deliveries/view';

type Props = {
    cover: DeliveryPhoto;
    alt: string;
    isOverlay: boolean;
    focalX: number;
    focalY: number;
};

// Match delivery-drift's maximum scale so the final animation frame retains enough detail.
const driftScale = 1.04;

/** Sizes the full photograph behind a cover crop, including heroes taller than the viewport. */
export function DeliveryCover({ cover, alt, isOverlay, focalX, focalY }: Props) {
    const { width, height } = cover;
    const [measuredSize, setMeasuredSize] = useState<string | null>(null);
    const measureFrame = useCallback(
        (element: HTMLDivElement | null) => {
            if (!element) return;
            const measure = () => {
                const bounds = element.getBoundingClientRect();
                if (bounds.width <= 0 || bounds.height <= 0) return;
                setMeasuredSize(getPhotoImageSize({ width, height }, bounds, driftScale));
            };
            measure();
            const observer = new ResizeObserver(measure);
            observer.observe(element);
            return () => observer.disconnect();
        },
        [width, height],
    );
    const scaledRatio = (cover.width / cover.height) * driftScale;
    // The server's preload must account for the tall crop before measurement and hydration.
    const initialSizes = isOverlay
        ? `max(104vw, ${100 * scaledRatio}svh)`
        : `max(104vw, ${280 * scaledRatio}px, min(${70 * scaledRatio}svh, ${850 * scaledRatio}px))`;

    return (
        <div ref={measureFrame} className="delivery-cover-frame">
            <Image
                src={cover.src}
                alt={alt}
                width={cover.width}
                height={cover.height}
                quality={90}
                sizes={measuredSize ?? initialSizes}
                preload
                className="delivery-cover"
                style={{ objectPosition: `${focalX}% ${focalY}%` }}
            />
        </div>
    );
}
