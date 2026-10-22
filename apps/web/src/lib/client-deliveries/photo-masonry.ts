type PhotoDimensions = { width: number; height: number };

/** Measured container width and masonry design tokens, in CSS pixels where applicable. */
export type PhotoMasonryMeasurements = {
    width: number;
    gap: number;
    columns: number;
    landscapeRatio: number;
    portraitRatio: number;
};

/** Tile coordinates remain in saved photo order for keyboard and lightbox navigation. */
export type PhotoMasonryTile = {
    index: number;
    column: number;
    left: number;
    top: number;
    width: number;
    height: number;
    isBottom: boolean;
};

/** Account for the part of an object-cover image hidden outside its tile; the browser applies pixel density. */
export function getPhotoImageSize(
    photo: PhotoDimensions,
    tile: Pick<PhotoMasonryTile, 'width' | 'height'>,
    scale = 1,
): string {
    return `${Math.ceil(Math.max(tile.width, tile.height * (photo.width / photo.height)) * scale)}px`;
}

/**
 * Fills the shortest equal-width column, resolving ties left to right. Normal tiles
 * use the landscape/portrait ratios. Only the final tile in each occupied column
 * changes height to share a bottom edge, with object-cover handling that crop.
 */
export function getPhotoMasonry(photos: readonly PhotoDimensions[], measurements: PhotoMasonryMeasurements) {
    if (!photos.length || measurements.width <= 0) return { height: 0, tiles: [] };

    const { width, gap, columns: columnCount, landscapeRatio, portraitRatio } = measurements;
    const columnWidth = (width - gap * (columnCount - 1)) / columnCount;
    const columns: { column: number; nextTop: number; last?: PhotoMasonryTile }[] = Array.from(
        { length: Math.min(columnCount, photos.length) },
        (_, column) => ({ column, nextTop: 0 }),
    );
    const tiles: PhotoMasonryTile[] = [];
    photos.forEach((photo, index) => {
        const shortest = columns.reduce((first, second) => (second.nextTop < first.nextTop ? second : first));
        const ratio = photo.width < photo.height ? portraitRatio : landscapeRatio;
        const tile = {
            index,
            column: shortest.column,
            left: shortest.column * (columnWidth + gap),
            top: shortest.nextTop,
            width: columnWidth,
            height: columnWidth / ratio,
            isBottom: false,
        };
        tiles.push(tile);
        shortest.nextTop += tile.height + gap;
        shortest.last = tile;
    });

    const averageBottom = columns.reduce((sum, column) => sum + column.nextTop - gap, 0) / columns.length;
    // Keep at least 75% of each last tile's normal height; any extra fill comes from the shorter columns.
    const minimumBottom = Math.max(...columns.map(({ last }) => (last ? last.top + last.height * 0.75 : 0)));
    const height = Math.max(averageBottom, minimumBottom);
    for (const { last } of columns) {
        if (!last) continue;
        last.height = height - last.top;
        last.isBottom = true;
    }
    return { height, tiles };
}
