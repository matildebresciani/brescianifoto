import type { PayloadRequest } from 'payload';
import { isLocale, localizedCollections, type RoutedCollectionSlug } from '@/i18n/localized-collections';
import { getServerSideURL } from './get-url';

export type PreviewProps = {
    collection: RoutedCollectionSlug;
    slug: unknown;
    req: PayloadRequest;
};

export const generatePreviewPath = ({ collection, slug, req }: PreviewProps) => {
    const localePart = isLocale(req.locale) && req.locale;

    if (!localePart || typeof slug !== 'string') return null;

    const localizedCollection = collection !== 'pages' && localizedCollections[collection][localePart];
    const collectionPart = localizedCollection ? `/${localizedCollection}` : '';
    const slugPart = slug === '/' ? '' : `/${slug}`;
    const fullPath = `/${localePart}${collectionPart}${slugPart}`;

    const params = {
        slug,
        collection,
        path: fullPath,
        locale: localePart,
    };

    const encodedParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        encodedParams.append(key, value);
    });

    const url = `${getServerSideURL()}/next/preview?${encodedParams.toString()}`;

    return url;
};
