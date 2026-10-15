/** Assigns photos across columns while retaining their saved index for the lightbox and loading priority. */
export function getGalleryColumns<T>(items: readonly T[], columnCount: 2 | 3) {
    const indexedItems = items.map((item, index) => ({ item, index }));

    return Array.from({ length: columnCount }, (_, column) => ({
        id: `gallery-column-${column}`,
        items: indexedItems.filter(({ index }) => index % columnCount === column),
    }));
}
