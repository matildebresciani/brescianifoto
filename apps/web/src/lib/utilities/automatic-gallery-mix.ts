import type { Gallery, Media } from '@/payload-types';

type SourceGallery = Pick<Gallery, 'id' | 'gallery'>;

/** Samples galleries in rounds so a large shoot cannot occupy the entire mix. */
export function createAutomaticGalleryMix(galleries: SourceGallery[], random = Math.random, limit = 24): string[] {
    const shuffle = <T>(items: T[]): T[] => {
        const result = [...items];
        for (let index = result.length - 1; index > 0; index--) {
            const target = Math.floor(random() * (index + 1));
            const item = result[index];
            const replacement = result[target];
            if (item === undefined || replacement === undefined) continue;
            result[index] = replacement;
            result[target] = item;
        }
        return result;
    };
    const columns = shuffle(galleries).map((gallery) =>
        shuffle(gallery.gallery.filter(isUsablePhoto).map((photo) => photo.id)),
    );
    const selected = new Set<string>();
    while (selected.size < limit && columns.some((column) => column.length > 0)) {
        for (const column of columns) {
            let id = column.pop();
            while (id && selected.has(id)) id = column.pop();
            if (id) selected.add(id);
            if (selected.size === limit) break;
        }
    }
    return [...selected];
}

/** Deleted references and non-image uploads never enter the public mix. */
export function isUsablePhoto(photo: string | Media | null | undefined): photo is Media {
    return (
        typeof photo === 'object' &&
        photo !== null &&
        Boolean(photo.url) &&
        Boolean(photo.mimeType?.startsWith('image/'))
    );
}

/** Removes ineligible photos without changing the persisted order or refilling gaps. */
export function resolveAutomaticGalleryMix(ids: string[], galleries: SourceGallery[]): Media[] {
    const eligible = new Map(
        galleries.flatMap((gallery) => gallery.gallery.filter(isUsablePhoto).map((photo) => [photo.id, photo])),
    );
    return ids.flatMap((id) => {
        const photo = eligible.get(id);
        return photo ? [photo] : [];
    });
}
