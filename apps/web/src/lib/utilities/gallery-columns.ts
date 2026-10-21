type ImageDimensions = {
    width?: number | null;
    height?: number | null;
};

/** Measured column width and vertical gap in CSS pixels. */
export type GalleryLayoutMeasurements = {
    columnWidth: number;
    gap: number;
};

/**
 * Places each photo in the shortest column, resolving ties from left to right.
 * Original indices preserve the saved lightbox sequence and loading priority.
 * Before measurement, unit-width columns provide a deterministic aspect-ratio layout.
 */
export function getGalleryColumns<T extends ImageDimensions>(
    items: readonly T[],
    columnCount: 2 | 3,
    { columnWidth, gap }: GalleryLayoutMeasurements = { columnWidth: 1, gap: 0 },
) {
    const columns: { id: string; items: { item: T; index: number }[]; nextTop: number }[] = Array.from(
        { length: columnCount },
        (_, column) => ({
            id: `gallery-column-${column}`,
            items: [],
            nextTop: 0,
        }),
    );
    items.forEach((item, index) => {
        const shortestColumn = columns.reduce((shortest, column) =>
            column.nextTop < shortest.nextTop ? column : shortest,
        );

        const { width, height } = item;
        const hasDimensions =
            typeof width === 'number' &&
            typeof height === 'number' &&
            Number.isFinite(width) &&
            Number.isFinite(height) &&
            width > 0 &&
            height > 0;
        const ratio = hasDimensions ? height / width : 1;
        const estimatedHeight = columnWidth * (Number.isFinite(ratio) && ratio > 0 ? ratio : 1);

        shortestColumn.items.push({ item, index });
        // Include the trailing gap so the next photo is compared at its actual starting position.
        shortestColumn.nextTop += estimatedHeight + gap;
    });

    return columns.map(({ id, items }) => ({ id, items }));
}
