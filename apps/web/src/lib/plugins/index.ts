import { payloadCloudPlugin } from '@payloadcms/payload-cloud';
import { seoPlugin } from '@payloadcms/plugin-seo';
import type { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types';
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob';
import type { Plugin } from 'payload';

import { isLocale } from '@/i18n/localized-collections';
import { getServerSideURL } from '@/lib/utilities/get-url';
import type { Page, Post } from '@/payload-types';

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
    seoPlugin({
        generateTitle,
        generateURL,
    }),
    payloadCloudPlugin(),
    vercelBlobStorage({
        enabled: process.env.NODE_ENV === 'production',
        // Specify which collections should use Vercel Blob
        collections: {
            media: true,
            icons: true,
        },
        // Token provided by Vercel once Blob storage is added to your Vercel project
        token: process.env.BLOB_READ_WRITE_TOKEN,
    }),
];
