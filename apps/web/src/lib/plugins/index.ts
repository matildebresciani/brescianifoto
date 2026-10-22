import { payloadCloudPlugin } from '@payloadcms/payload-cloud';
import { seoPlugin } from '@payloadcms/plugin-seo';
import type { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types';
import { mediaGalleryPlugin } from '@sitebytom/payload-media-gallery';
import type { Plugin } from 'payload';

import { isLocale } from '@/i18n/localized-collections';
import { getServerSideURL } from '@/lib/utilities/get-url';
import type { Page, Post } from '@/payload-types';
import { r2Storage } from './r2-storage';

const generateTitle: GenerateTitle<Post | Page> = ({ doc }) => {
    return doc?.title ? `${doc.title} | Oak Boilerplate` : 'Oak Boilerplate';
};

const generateURL: GenerateURL<Post | Page> = ({ doc, locale }) => {
    const url = getServerSideURL();
    const validatedLocale = isLocale(locale) ? locale : undefined;

    // TODO: Skal vi også exclude default locale hvis det er det som er valgt?
    return doc?.slug ? `${url}${validatedLocale ? `/${validatedLocale}` : ''}/${doc.slug}` : url;
};

export const plugins: Plugin[] = [
    mediaGalleryPlugin({
        collections: ['media'],
        defaultView: 'grid',
        layouts: {
            grid: { enabled: true, footer: 'always' },
            justified: false,
            masonry: false,
        },
        lightbox: true,
        edit: true,
    }),
    seoPlugin({
        generateTitle,
        generateURL,
    }),
    payloadCloudPlugin(),
    r2Storage,
];
