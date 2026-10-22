export type PhotoLibrarySort = 'name' | '-name' | 'newest' | 'oldest';

type LibraryPhoto = { id: string; originalFilename: string; createdAt: string };

const filenames = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

/** Toggle only the visible IDs, keeping selections made on other pages and avoiding duplicates. */
export function togglePhotoSelection(current: string[], visible: string[]): string[] {
    return visible.every((id) => current.includes(id))
        ? current.filter((id) => !visible.includes(id))
        : [...new Set([...current, ...visible])];
}

/** Sort the complete filename index before pagination so numbered shoots keep their sequence across pages. */
export function sortLibraryPhotos<T extends LibraryPhoto>(photos: readonly T[], sort: PhotoLibrarySort): T[] {
    return [...photos].sort((first, second) => {
        const comparison =
            sort === 'name' || sort === '-name'
                ? filenames.compare(first.originalFilename, second.originalFilename)
                : first.createdAt.localeCompare(second.createdAt);
        const direction = sort === '-name' || sort === 'newest' ? -1 : 1;
        return comparison * direction || first.id.localeCompare(second.id);
    });
}
