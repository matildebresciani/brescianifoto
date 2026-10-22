'use client';

import { useEffect, useRef, useState } from 'react';
import { ImageMedia } from '@/components/atoms/frontend/media/ImageMedia';
import {
    canPreloadLightboxImages,
    getLightboxImageKey,
    getLightboxImageSize,
    getLightboxNeighbors,
    type LightboxViewport,
} from '@/lib/utilities/lightbox-images';
import type { Media } from '@/payload-types';

type Props = {
    items: Media[];
    index: number;
    viewport: LightboxViewport | null;
    isCurrentReady: boolean;
    quality?: number;
};
type Request = { image: Media; size: string; quality: number; key: string };

function remember(cache: Set<string>, key: string) {
    cache.delete(key);
    cache.add(key);
    const oldest = cache.values().next().value;
    if (cache.size > 12 && oldest !== undefined) cache.delete(oldest);
}

/** Warms only the next slide after the selected photo has loaded. */
export default function LightboxPreloader({ items, index, viewport, isCurrentReady, quality = 75 }: Props) {
    const completedRef = useRef(new Set<string>());
    const [request, setRequest] = useState<Request | null>(null);

    useEffect(() => {
        const current = items[index];
        if (!current || !viewport || !isCurrentReady) return;
        remember(
            completedRef.current,
            `${getLightboxImageKey(current)}:${getLightboxImageSize(current, viewport)}:${quality}`,
        );
        if (request || !canPreloadLightboxImages()) return;

        const next = getLightboxNeighbors(items, index)
            .map((image) => {
                const size = getLightboxImageSize(image, viewport);
                return { image, size, quality, key: `${getLightboxImageKey(image)}:${size}:${quality}` };
            })
            .find(({ key }) => !completedRef.current.has(key));
        if (!next) return;

        // Navigation cancels this timer. An existing request is allowed to finish before another starts.
        const timer = window.setTimeout(() => setRequest(next), 200);
        return () => window.clearTimeout(timer);
    }, [items, index, viewport, isCurrentReady, request, quality]);

    if (!request) return null;
    const finish = () => {
        // Remember failures too, so a broken neighbor cannot create an automatic retry loop.
        remember(completedRef.current, request.key);
        setRequest(null);
    };

    return (
        <ImageMedia
            key={request.key}
            resource={request.image}
            quality={request.quality}
            alt=""
            className="hidden"
            size={request.size}
            loading="eager"
            fetchPriority="low"
            onLoad={finish}
            onError={finish}
        />
    );
}
