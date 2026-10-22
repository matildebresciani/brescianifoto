/** Older records retain their exact cached URL until their source file changes. */
export function getMediaImageVersion(image: { imageVersion?: string | null; updatedAt: string }): string {
    return image.imageVersion || image.updatedAt;
}
