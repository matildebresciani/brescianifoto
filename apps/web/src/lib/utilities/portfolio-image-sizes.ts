// Match BaseBlock's 1920px maximum, 1.25rem/3rem side padding and each grid's actual gaps.
export const galleryImageSizes =
    '(min-width: 1920px) calc((1920px - 6rem - 32px) / 3), (min-width: 1024px) calc((100vw - 6rem - 32px) / 3), (min-width: 768px) calc((100vw - 6rem - 16px) / 2), calc((100vw - 2.5rem - 8px) / 2)';

export const galleryCardImageSizes =
    '(min-width: 1920px) calc((1920px - 6rem - 32px) / 3), (min-width: 1024px) calc((100vw - 6rem - 32px) / 3), (min-width: 768px) calc((100vw - 6rem - 16px) / 2), (min-width: 640px) calc((100vw - 2.5rem - 16px) / 2), calc(100vw - 2.5rem)';

export const postCardImageSizes =
    '(min-width: 1920px) calc((1920px - 6rem - 3.5rem) / 3), (min-width: 1024px) calc((100vw - 6rem - 3.5rem) / 3), (min-width: 768px) calc((100vw - 6rem - 1.75rem) / 2), calc(100vw - 2.5rem)';

export const textImageSizes =
    '(min-width: 1920px) calc((1920px - 6rem - 48px) / 2), (min-width: 1024px) calc((100vw - 6rem - 48px) / 2), (min-width: 768px) calc(100vw - 6rem), calc(100vw - 2.5rem)';
