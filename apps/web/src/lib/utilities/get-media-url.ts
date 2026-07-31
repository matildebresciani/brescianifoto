import { getClientSideURL } from './get-url';

/**
 * Processes media resource URL to ensure proper formatting
 * @param url The original URL from the resource
 * @param cacheTag Optional cache tag to append to the URL
 * @returns Properly formatted URL with cache tag if provided
 */
export const getMediaUrl = (url: string | null | undefined, cacheTag?: string | null): string => {
    if (!url) return '';

    let cache = cacheTag;

    if (cache && cache !== '') {
        cache = encodeURIComponent(cache);
    }

    // Check if URL already has http/https protocol
    if (url.startsWith('http://') || url.startsWith('https://')) {
        const separator = url.includes('?') ? '&' : '?';
        return cache ? `${url}${separator}${cache}` : url;
    }

    // Otherwise prepend client-side URL
    const baseUrl = getClientSideURL();

    const separator = url.includes('?') ? '&' : '?';
    return cache ? `${baseUrl}${url}${separator}${cache}` : `${baseUrl}${url}`;
};
