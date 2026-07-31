import type { LivePreviewConfig } from 'payload';
import type { RoutedCollectionSlug } from '@/i18n/localized-collections';
import { generatePreviewPath } from '../utilities/generate-preview-path';

export const payloadLivePreview = (collection: RoutedCollectionSlug): LivePreviewConfig => {
    return {
        url: ({ data, req }) => {
            const path = generatePreviewPath({
                slug: typeof data?.slug === 'string' ? data.slug : '',
                collection,
                req,
            });

            return path;
        },
    };
};
