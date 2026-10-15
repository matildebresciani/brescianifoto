import { describe, expect, it } from 'vitest';
import { imageMock } from '@/__mocks__/storybook-mocks';
import { createAutomaticGalleryMix, resolveAutomaticGalleryMix } from './automatic-gallery-mix';

const photo = (id: string) => ({ ...imageMock, id });

describe('automatic gallery mix', () => {
    it('samples across shoots, caps at 24 and deduplicates shared photos', () => {
        const galleries = ['a', 'b', 'c'].map((id) => ({
            id,
            gallery: Array.from({ length: 40 }, (_, index) => photo(`${id}-${index}`)),
        }));
        const mix = createAutomaticGalleryMix(galleries, () => 0.5);
        expect(mix).toHaveLength(24);
        expect(new Set(mix).size).toBe(24);
        for (const id of ['a', 'b', 'c']) expect(mix.filter((item) => item.startsWith(id))).toHaveLength(8);
        expect(
            createAutomaticGalleryMix([
                { id: 'a', gallery: [photo('same'), photo('same')] },
                { id: 'b', gallery: [photo('same'), photo('other')] },
            ]),
        ).toEqual(expect.arrayContaining(['same', 'other']));
        expect(galleries[0]?.gallery[0]?.id).toBe('a-0');
    });
    it('handles small and empty pools and skips deleted references and non-images', () => {
        expect(createAutomaticGalleryMix([])).toEqual([]);
        expect(
            createAutomaticGalleryMix([
                {
                    id: 'a',
                    gallery: [
                        'deleted',
                        { ...photo('pdf'), mimeType: 'application/pdf' },
                        { ...photo('missing'), url: null },
                        photo('valid'),
                    ],
                },
            ]),
        ).toEqual(['valid']);
    });
    it('removes deleted or unpublished photos without changing or refilling the saved order', () => {
        const remaining = [{ id: 'public', gallery: [photo('third'), photo('first'), photo('new')] }];
        expect(
            resolveAutomaticGalleryMix(['first', 'deleted', 'private', 'third'], remaining).map((item) => item.id),
        ).toEqual(['first', 'third']);
        expect(resolveAutomaticGalleryMix(['first'], [])).toEqual([]);
    });
});
