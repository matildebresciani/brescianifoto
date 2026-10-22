import type { Media } from '@/payload-types';
import { getMediaImageVersion } from './media-image-version';
import { wrapIndex } from './wrap-index';

/** Available photo area, excluding the lightbox controls and thumbnails, in CSS pixels. */
export type LightboxViewport = { width: number; height: number };

/** Reserves the same fitted area for both the skeleton and the decoded photograph. */
export function getLightboxImageDimensions(image: Media, viewport: LightboxViewport): LightboxViewport {
    const { width, height } = image;
    const hasDimensions =
        typeof width === 'number' &&
        typeof height === 'number' &&
        Number.isFinite(width) &&
        Number.isFinite(height) &&
        width > 0 &&
        height > 0;
    if (!hasDimensions) return viewport;
    const scale = Math.min(viewport.width / width, viewport.height / height, 1);
    return { width: width * scale, height: height * scale };
}

/** Only an explicit zoom requests a larger candidate. */
export function getLightboxImageSize(image: Media, viewport: LightboxViewport, scale = 1): string {
    return `${Math.max(1, Math.ceil(getLightboxImageDimensions(image, viewport).width * scale))}px`;
}

/** Identifies the same source and cache version across main images and speculative requests. */
export function getLightboxImageKey(image: Media): string {
    return JSON.stringify([image.url, getMediaImageVersion(image)]);
}

/** Warm only the next slide; backward navigation uses the browser cache or skeleton. */
export function getLightboxNeighbors(items: Media[], index: number): Media[] {
    const current = items[index];
    if (!current || items.length < 2) return [];
    const next = items[wrapIndex(index, 1, items.length)];
    if (!next?.url || getLightboxImageKey(next) === getLightboxImageKey(current)) return [];
    return [next];
}

/** Avoid speculative transfers when the browser reports data saving or a very slow connection. */
export function canPreloadLightboxImages(): boolean {
    if (typeof navigator === 'undefined' || !('connection' in navigator)) return true;
    const connection = navigator.connection;
    if (!connection || typeof connection !== 'object') return true;
    if ('saveData' in connection && connection.saveData === true) return false;
    return !(
        'effectiveType' in connection &&
        (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')
    );
}
