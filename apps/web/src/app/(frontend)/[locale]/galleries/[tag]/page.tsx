import Link from 'next/link';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import BaseBlock from '@/components/organisms/blocks/base-block/BaseBlock';
import { getCachedCollection } from '@/lib/data/payload/get-cached-collection';
import { assertLocale } from '@/lib/utilities/assert-locale';
import { formatLinkByCollection } from '@/lib/utilities/format-link';

type Props = {
    params: Promise<{
        locale: string;
        tag: string;
    }>;
};

export default async function GalleriesByTagPage({ params: paramsPromise }: Props) {
    const { locale, tag } = await paramsPromise;

    assertLocale(locale);
    setRequestLocale(locale);

    const tags = await getCachedCollection({
        collection: 'tags',
        locale,
        whereFields: { slug: { equals: tag } },
        publicOnly: false,
        limit: 1,
    });

    const tagDoc = tags.docs[0];
    if (!tagDoc) return notFound();

    const galleries = await getCachedCollection({
        collection: 'galleries',
        locale,
        whereFields: { 'tags.slug': { equals: tagDoc.slug } },
        limit: 100,
    });

    return (
        <article>
            <BaseBlock className="oakgrid mt-6 lg:mt-16">
                <div className="col-span-12">
                    <h1 className="text-2xl font-medium lg:text-4xl">{tagDoc.tag ?? tagDoc.name}</h1>
                </div>
            </BaseBlock>

            <BaseBlock className="oakgrid mt-6 lg:mt-10">
                <ul className="col-span-12 grid gap-y-10 gap-x-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-y-20">
                    {galleries.docs.map((gallery) => {
                        const link = formatLinkByCollection(gallery.slug, 'galleries', locale);
                        if (!link) return null;

                        return (
                            <li key={gallery.id}>
                                <Link href={link}>{gallery.title}</Link>
                            </li>
                        );
                    })}
                </ul>
            </BaseBlock>
        </article>
    );
}

export const dynamic = 'force-static';
