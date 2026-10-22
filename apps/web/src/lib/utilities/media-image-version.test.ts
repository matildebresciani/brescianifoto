import { describe, expect, it } from 'vitest';
import { getMediaUrl } from './get-media-url';
import { getMediaImageVersion } from './media-image-version';

describe('photo cache identity', () => {
    const url = 'https://photos.example.test/media/photo.jpg';

    it('preserves the exact legacy URL when a metadata edit pins its previous version', () => {
        const legacy = { updatedAt: '2026-10-14T22:36:17.605Z' };
        const edited = { imageVersion: legacy.updatedAt, updatedAt: '2026-10-22T17:00:00Z' };
        expect(getMediaUrl(url, getMediaImageVersion(edited))).toBe(getMediaUrl(url, getMediaImageVersion(legacy)));
        expect(getMediaUrl(url, getMediaImageVersion({ ...edited, imageVersion: 'new-file' }))).not.toBe(
            getMediaUrl(url, getMediaImageVersion(legacy)),
        );
    });

    it('never modifies an S3 signature by appending a photo version', () => {
        const signed = `${url}?X-Amz-Date=20261022T000000Z&X-Amz-Signature=signature`;
        expect(getMediaUrl(signed, 'checksum')).toBe(signed);
        expect(getMediaUrl(signed, 'changed-metadata')).toBe(signed);
    });
});
