import { describe, expect, it } from 'vitest';
import { mergeUploadedPhotos } from './upload-client';

describe('uploads added directly to a photo section', () => {
    it('preserves the latest selection order and appends the uploaded batch in selection order', () => {
        expect(mergeUploadedPhotos(['existing-b', 'existing-a'], ['new-b', 'new-a'])).toEqual([
            'existing-b',
            'existing-a',
            'new-b',
            'new-a',
        ]);
    });
    it('does not duplicate completed files when a completion is retried', () => {
        expect(mergeUploadedPhotos(['existing', 'new'], ['new', 'next', 'next'])).toEqual(['existing', 'new', 'next']);
    });
    it('supports empty new sections and populated relationship values', () => {
        expect(mergeUploadedPhotos(undefined, ['new'])).toEqual(['new']);
        expect(mergeUploadedPhotos([{ id: 'existing' }, null], ['new'])).toEqual(['existing', 'new']);
    });
});
