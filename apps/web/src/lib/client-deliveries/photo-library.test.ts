import { describe, expect, it } from 'vitest';
import { sortLibraryPhotos, togglePhotoSelection } from './photo-library';

const photo = (number: number) => ({
    id: `photo-${number}`,
    originalFilename: `17.10.26_Andrea-Emil-Bryllup_Matilde-Bresciani-${number}.JPG`,
    createdAt: new Date(Date.UTC(2026, 9, 22, 0, number)).toISOString(),
});

describe('photo library sorting', () => {
    it('selects and deselects only the visible page while retaining other pages', () => {
        expect(togglePhotoSelection(['other-page', 'visible-1'], ['visible-1', 'visible-2'])).toEqual([
            'other-page',
            'visible-1',
            'visible-2',
        ]);
        expect(togglePhotoSelection(['other-page', 'visible-1', 'visible-2'], ['visible-1', 'visible-2'])).toEqual([
            'other-page',
        ]);
        expect(togglePhotoSelection(['other-page'], [])).toEqual(['other-page']);
    });
    it('keeps a 220-photo numbered shoot in natural filename order across page boundaries', () => {
        const originals = Array.from({ length: 220 }, (_, index) => photo(220 - index));
        const sorted = sortLibraryPhotos(originals, 'name');
        expect(sorted.map((item) => item.id)).toEqual(Array.from({ length: 220 }, (_, index) => `photo-${index + 1}`));
        expect(sorted.slice(24, 48).map((item) => item.id)).toEqual(
            Array.from({ length: 24 }, (_, index) => `photo-${index + 25}`),
        );
        expect(originals[0]?.id).toBe('photo-220');
        expect(sortLibraryPhotos(originals, '-name').map((item) => item.id)).toEqual(originals.map((item) => item.id));
    });
    it('sorts upload dates independently of filenames and breaks ties consistently', () => {
        const photos = [photo(2), { ...photo(1), createdAt: photo(3).createdAt }, photo(3)];
        expect(sortLibraryPhotos(photos, 'oldest').map((item) => item.id)).toEqual(['photo-2', 'photo-1', 'photo-3']);
        expect(sortLibraryPhotos(photos, 'newest').map((item) => item.id)).toEqual(['photo-1', 'photo-3', 'photo-2']);
        expect(
            sortLibraryPhotos(
                [
                    { ...photo(1), id: 'b' },
                    { ...photo(1), id: 'a' },
                ],
                'name',
            ).map((item) => item.id),
        ).toEqual(['a', 'b']);
    });
});
