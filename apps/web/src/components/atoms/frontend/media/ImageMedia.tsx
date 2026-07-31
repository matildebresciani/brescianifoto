'use client';
import type { StaticImageData } from 'next/image';
import NextImage from 'next/image';
import type React from 'react';
import { cssVariables } from '@/cssVariables';
import { getMediaUrl } from '@/lib/utilities/get-media-url';
import { cn } from '@/lib/utilities/ui';
import type { Props as MediaProps } from './image-media-types';

const { breakpoints } = cssVariables;

export const ImageMedia: React.FC<MediaProps> = (props) => {
    const {
        alt: altFromProps,
        fill,
        className,
        priority,
        resource,
        size: sizeFromProps,
        src: srcFromProps,
        loading: loadingFromProps,
        quality: qualityFromProps,
        fetchPriority,
    } = props;

    let width: number | undefined;
    let height: number | undefined;
    let alt = altFromProps;
    let src: StaticImageData | string = srcFromProps || '';

    if (!src && resource && typeof resource === 'object') {
        const { alt: altFromResource, height: fullHeight, url, width: fullWidth } = resource;

        width = fullWidth ?? undefined;
        height = fullHeight ?? undefined;
        alt = altFromResource || '';

        const cacheTag = resource.updatedAt;

        src = getMediaUrl(url, cacheTag);
    }

    const loading = loadingFromProps || (!priority ? 'lazy' : undefined);

    // NOTE: this is used by the browser to determine which image to download at different screen sizes
    const sizes = sizeFromProps
        ? sizeFromProps
        : Object.entries(breakpoints)
              .map(([, value]) => `(max-width: ${value}px) ${value * 2}w`)
              .join(', ');

    const focalX = typeof resource === 'object' ? (resource?.focalX ?? 50) : 50;
    const focalY = typeof resource === 'object' ? (resource?.focalY ?? 50) : 50;

    return (
        <NextImage
            alt={alt || ''}
            className={cn(className)}
            style={{ objectPosition: `${focalX}% ${focalY}%` }}
            fill={fill}
            height={!fill ? height : undefined}
            priority={priority}
            quality={qualityFromProps || 75}
            loading={loading}
            sizes={sizes}
            src={src}
            width={!fill ? width : undefined}
            fetchPriority={fetchPriority}
        />
    );
};
