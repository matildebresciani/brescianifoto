import { notFound } from 'next/navigation';
import type { NextRequest } from 'next/server';
import { getServerSideSitemap } from 'next-sitemap';
import { replace } from 'string-ts';
import z from 'zod';
import { locales, routedCollections } from '@/i18n/localized-collections';
import { getCachedArchiveSitemaps } from '@/lib/data/payload/get-cached-archive-sitemap';
import { getCachedSitemap } from '@/lib/data/payload/get-cached-sitemap';

const LocalesSchema = z
    .object({
        collection: z.enum(['archives', ...routedCollections]),
        localexml: z.templateLiteral([z.enum(locales), '.xml']),
    })
    .transform((data) => ({
        ...data,
        locale: replace(data.localexml, '.xml', ''),
    }));

export async function GET(
    // biome-ignore lint: Next.js requires this signature
    request: NextRequest,
    { params: paramsPromise }: RouteContext<'/sitemaps/[collection]/[localexml]'>,
) {
    const params = await paramsPromise;
    const parsedParams = LocalesSchema.safeParse(params);

    if (!parsedParams.success) return notFound();

    const { collection, locale } = parsedParams.data;

    if (collection === 'archives') {
        const sitemap = await getCachedArchiveSitemaps(locale);
        return getServerSideSitemap(sitemap);
    }

    if (routedCollections.includes(collection)) {
        const sitemap = await getCachedSitemap(collection, locale);
        return getServerSideSitemap(sitemap);
    }

    return notFound();
}
