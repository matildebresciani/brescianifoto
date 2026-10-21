import { createHash } from 'node:crypto';

/** Immutable asset IDs and content checksums identify a photo set, independent of display order. */
export function photoSetRevision(photos: { id: string; checksum: string }[]): string {
    return createHash('sha256')
        .update(
            photos
                .map((photo) => `${photo.id}:${photo.checksum}`)
                .sort()
                .join('\n'),
        )
        .digest('hex');
}
