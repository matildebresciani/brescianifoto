import type { Metadata } from 'next';
import {
    defaultLocale,
    isLocale,
    type Locale,
    localizedPaths,
    paginationTranslations,
} from '@/i18n/localized-collections';
import { initPayload } from '../config';
import { pageNumberSchema } from '../schemas/pages';
import { trimTrailingSlash } from '../utilities/composables';
import { formatLinkByCollection } from '../utilities/format-link';
import { getServerSideURL } from '../utilities/get-url';
import { getCachedEntryBySlug } from './payload/get-cached-entry-by-slug';
import { getCachedOptions } from './payload/get-cached-options';
import { getImageSlugFromMedia } from './payload/get-image-url';

export const metadataIcons = {
    icon: [
        {
            url: '/images/favicons/favicon-16x16.png',
            sizes: '16x16',
            type: 'image/png',
        },
        {
            url: '/images/favicons/favicon-32x32.png',
            sizes: '32x32',
            type: 'image/png',
        },
        {
            url: '/images/favicons/favicon-96x96.png',
            sizes: '96x96',
            type: 'image/png',
        },
    ],
    apple: [
        {
            url: '/images/favicons/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
        },
    ],
};

export const getDefaultOgImage = async (locale: Locale) => {
    const [payload, options] = await Promise.all([initPayload(), getCachedOptions(locale)]);

    if (options.meta?.defaultImage) {
        const image = options.meta.defaultImage;

        if (typeof image === 'object' && image.url) {
            return {
                images: [
                    {
                        url: `${trimTrailingSlash(getServerSideURL())}${image.url}`,
                    },
                ],
            };
        }

        if (typeof image === 'string') {
            const defaultOgImage = await payload.findByID({
                collection: 'media',
                id: image,
                locale,
            });

            if (defaultOgImage.url) {
                return {
                    images: [
                        {
                            url: `${trimTrailingSlash(getServerSideURL())}${defaultOgImage.url}`,
                        },
                    ],
                };
            }
        }
    }

    return null;
};

type CollectionSingleTypes = 'pages' | 'posts';
export const generateEntryMetadata = async (slug: string, collection: CollectionSingleTypes, locale: Locale) => {
    const meta: Metadata = {};

    const [entry, options] = await Promise.all([
        getCachedEntryBySlug({
            collection: collection,
            slug: slug,
            locale: locale,
        }),
        getCachedOptions(locale),
    ]);

    if (!entry) return meta;

    meta.title = `${options.meta?.metaTitlePrefix ?? ''}${entry.meta?.title?.length ? entry.meta.title : entry.title}${options.meta?.metaTitleSuffix ?? ''}`;
    if (entry.meta?.description) meta.description = entry.meta.description;

    if (entry.meta?.image) {
        const imageSlug = await getImageSlugFromMedia(entry.meta.image, locale);
        if (imageSlug) {
            const imagePath = imageSlug.startsWith('/')
                ? `${trimTrailingSlash(getServerSideURL())}${imageSlug}`
                : imageSlug;

            meta.openGraph = {
                images: [
                    {
                        url: imagePath,
                    },
                ],
            };
        }
    }

    if (entry.slug) {
        meta.alternates = {
            canonical: formatLinkByCollection(entry.slug, collection, locale),
        };
    }

    return meta;
};

type ArchiveMetadataProps = {
    slug: string | undefined;
    collection: 'posts';
    locale: string | undefined;
    pageNumber: string | number | undefined;
};

export const generateArchiveMetadata = async (props: ArchiveMetadataProps) => {
    const { slug, collection, locale, pageNumber } = props;
    const validatedLocale = locale && isLocale(locale) ? locale : defaultLocale;
    const validatedPageNumber = pageNumberSchema.safeParse(pageNumber);

    const archivesSlug = 'postsArchiveMeta';

    const metadata: Metadata = {};

    const options = await getCachedOptions(validatedLocale, 1);

    if (slug) {
        const fallbackTitle = collection === 'posts' ? 'Artikler' : 'Events';
        metadata.title = `${fallbackTitle} | ${slug}`;
    } else {
        if (options.archives?.[archivesSlug]) {
            const { title, description } = options.archives[archivesSlug];

            if (title) {
                metadata.title = title;
            }

            if (description) {
                metadata.description = description;
            }
        }
    }

    if (options.archives?.[archivesSlug]) {
        const { image } = options.archives[archivesSlug];

        if (typeof image === 'object' && image?.url) {
            metadata.openGraph = {
                images: [
                    {
                        url: `${trimTrailingSlash(getServerSideURL())}${image.url}`,
                    },
                ],
            };
        }
    }

    let canonicalUrl = `/${validatedLocale === defaultLocale ? '' : validatedLocale}/${localizedPaths[collection][validatedLocale]}`;

    if (slug) {
        canonicalUrl = `${canonicalUrl}/${slug}`;
    }

    if (validatedPageNumber.success && validatedPageNumber.data && validatedPageNumber.data > 1) {
        canonicalUrl = `${canonicalUrl}/${paginationTranslations.page[validatedLocale]}/${validatedPageNumber.data}`;
    }

    metadata.alternates = {
        canonical: canonicalUrl,
    };

    return metadata;
};
