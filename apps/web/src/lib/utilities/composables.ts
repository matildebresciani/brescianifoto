import type { Gallery } from '@/payload-types';
import type { PayloadLinkType } from '../field-templates/links';

export const trimTrailingSlash = (url: string) => {
    return url.replace(/\/+$/, '');
};

export const payloadObject = <T>(value: string | T | null | undefined): T | undefined => {
    return typeof value === 'object' && value !== null ? value : undefined;
};

export const getGalleryCoverImage = (data: Pick<Gallery, 'contentMeta' | 'gallery'>) => {
    return payloadObject(data.contentMeta?.featuredImage) ?? payloadObject(data.gallery[0]);
};

export const getPayloadId = (item: { id: string } | string) => {
    return typeof item === 'string' ? item : item.id;
};

export const getPayloadIds = (items: Array<{ id: string } | string> | null | undefined) => {
    if (!items) return [];
    return items.map((item) => getPayloadId(item));
};

export const getThumbnailUrl = (slug: string, format?: 'jpg' | 'jpeg' | 'png' | 'webp' | 'gif') => {
    return `/images/block-thumbnails/${slug}.${format || 'jpg'}`;
};

export const getLinkTarget = (link?: PayloadLinkType) => {
    return link?.openNewTab === true ? '_blank' : '_self';
};
