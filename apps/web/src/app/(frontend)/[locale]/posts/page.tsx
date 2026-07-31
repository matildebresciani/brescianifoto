import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Where } from 'payload';
import Pagination from '@/components/molecules/frontend/Pagination';
import { generateArchiveMetadata } from '@/lib/data/metadata';
import { getCachedCollection } from '@/lib/data/payload/get-cached-collection';
import { pageNumberSchema } from '@/lib/schemas/pages';
import { assertLocale } from '@/lib/utilities/assert-locale';
import { formatLinkByCollection } from '@/lib/utilities/format-link';
import { payloadRedirects } from '@/lib/utilities/payload-redirects';

type Props = {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
    params: Promise<{
        locale: string;
        slug?: string;
        pageNumber?: string | number;
    }>;
};

const collection = 'posts';

export default async function PostsPage({ params: paramsPromise, searchParams: searchParamsPromise }: Props) {
    const searchParams = await searchParamsPromise;
    const { locale, slug, pageNumber } = await paramsPromise;

    assertLocale(locale);

    // Checking if there is a redirect from the Payload collection for the current slug
    const formattedLink = formatLinkByCollection(slug, collection, locale);
    if (formattedLink) {
        await payloadRedirects(formattedLink);
    }

    setRequestLocale(locale);

    const pageNumberValidation = pageNumberSchema.safeParse(pageNumber);
    if (!pageNumberValidation.success) {
        notFound();
    }

    const sanitizedPageNumber = pageNumberValidation.data ?? 1;

    const formattedSearchParams = Object.values(searchParams).flatMap((value) => {
        const splitValues = (Array.isArray(value) ? value[0] : value)?.split(',');
        return splitValues;
    });

    const querySlug: Where = slug
        ? {
              'categories.slug': {
                  equals: slug,
              },
          }
        : {};

    const queryFilters: Where = formattedSearchParams.length
        ? {
              'categories.slug': {
                  in: formattedSearchParams,
              },
          }
        : {};

    const where: Where = {
        ...querySlug,
        ...queryFilters,
    };

    const entries = await getCachedCollection({
        collection,
        locale,
        limit: 12,
        page: sanitizedPageNumber,
        depth: 1,
        whereFields: where,
        sort: '-publishedAt',
    });

    return (
        <article>
            <div className="base-block oakgrid mt-6 lg:mt-16">
                <div className="col-span-12">
                    <h1 className="text-2xl font-medium lg:text-4xl">Posts</h1>
                </div>
            </div>

            <section className="base-block-outer">
                <div className="base-block oakgrid mt-6 lg:mt-10">
                    <div className="col-span-12 grid gap-y-10 gap-x-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-y-20">
                        {entries.docs.map((entry) => {
                            const link = formatLinkByCollection(entry.slug, collection, locale);
                            if (!link) return null;

                            return (
                                <Link key={entry.id} href={link}>
                                    {entry.title}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>

            <Pagination
                totalPages={entries.totalPages}
                pageNumber={sanitizedPageNumber}
                locale={locale}
                className="my-6 lg:mt-20 lg:mb-16"
                routeDetails={{
                    route: collection,
                    type: 'path',
                    slug,
                }}
            />
        </article>
    );
}

export async function generateMetadata({ params: paramsPromise }: Props): Promise<Metadata> {
    const { locale, slug, pageNumber } = await paramsPromise;

    const metadata = await generateArchiveMetadata({
        slug,
        collection,
        locale,
        pageNumber,
    });

    return metadata;
}
