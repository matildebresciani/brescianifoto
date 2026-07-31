import type { MetadataRoute } from 'next';
import { locales, routedCollections } from '@/i18n/localized-collections';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL;

    return {
        rules: [
            {
                userAgent: '*',
                disallow: ['*?_rsc=*', '*?*%2C*', '*%2C*', '*,*', '/admin', '/api/*', '/next/*'],
            },
            {
                userAgent: 'Googlebot',
                disallow: ['*?_rsc=*', '/admin', '/api/*', '/next/*'],
            },
            {
                userAgent: 'Googlebot-image',
                disallow: ['*?_rsc=*', '/admin', '/api/*', '/next/*'],
            },
        ],
        sitemap: [
            ...[...routedCollections, 'archives'].flatMap((collection) =>
                locales.map((locale) => `${baseUrl}/sitemaps/${collection}/${locale}.xml`),
            ),
        ],
    };
}
