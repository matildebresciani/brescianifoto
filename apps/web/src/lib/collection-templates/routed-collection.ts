import type { CollectionConfig } from 'payload';
import { slugField } from '@/components/molecules/admin/fields/slug';
import type { RoutedCollectionSlug } from '@/i18n/localized-collections';
import { contentMeta } from '../field-templates/content-meta';
import { payloadLivePreview } from '../field-templates/live-preview';
import { payloadPublishedAt, payloadPublishStatus } from '../field-templates/publish-state';
import { payloadTitleCollection } from '../field-templates/title';
import { generatePreviewPath } from '../utilities/generate-preview-path';
import { createCollection } from './collection';

export const createRoutedCollection = <Slug extends RoutedCollectionSlug>(
    slug: Slug,
    config: Omit<CollectionConfig<Slug>, 'slug'>,
): CollectionConfig<Slug> => {
    return createCollection(slug, {
        ...config,
        admin: {
            useAsTitle: 'name',
            livePreview: payloadLivePreview(slug),
            preview: (data, { req }) =>
                generatePreviewPath({
                    slug: data?.slug,
                    collection: slug,
                    req,
                }),
            ...config.admin,
        },
        fields: [
            ...payloadTitleCollection,
            ...config.fields,
            payloadPublishedAt,
            payloadPublishStatus,
            ...slugField(),
            contentMeta(),
        ],
        versions: {
            maxPerDoc: 50,
        },
    });
};
