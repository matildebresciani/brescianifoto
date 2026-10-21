import type { Media } from '@/payload-types';
import { wrapIndex } from './wrap-index';

/** Available photo area, excluding the lightbox controls and thumbnails, in CSS pixels. */
export type LightboxViewport = { width: number; height: number };

/** Matches object-contain sizing; only an explicit zoom requests a larger candidate. */
export function getLightboxImageSize(image: Media, viewport: LightboxViewport, scale = 1): string {
    const { width, height } = image;
    const hasDimensions =
        typeof width === 'number' &&
        typeof height === 'number' &&
        Number.isFinite(width) &&
        Number.isFinite(height) &&
        width > 0 &&
        height > 0;
    const fittedWidth = hasDimensions
        ? Math.min(viewport.width, viewport.height * (width / height), width)
        : viewport.width;
    return `${Math.max(1, Math.ceil(fittedWidth * scale))}px`;
}

/** Identifies the same source and cache version across main images and speculative requests. */
export function getLightboxImageKey(image: Media): string {
    return JSON.stringify([image.url, image.updatedAt]);
}

/** The next and previous photos only, excluding duplicate sources and the selected photo. */
export function getLightboxNeighbors(items: Media[], index: number): Media[] {
    const current = items[index];
    if (!current || items.length < 2) return [];
    const seen = new Set([getLightboxImageKey(current)]);
    const neighbors: Media[] = [];
    for (const offset of [1, -1]) {
        const image = items[wrapIndex(index, offset, items.length)];
        if (!image?.url) continue;
        const key = getLightboxImageKey(image);
        if (seen.has(key)) continue;
        seen.add(key);
        neighbors.push(image);
    }
    return neighbors;
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
