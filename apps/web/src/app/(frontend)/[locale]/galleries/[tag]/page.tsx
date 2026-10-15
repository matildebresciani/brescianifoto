import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import GalleryCard from '@/components/molecules/frontend/GalleryCard';
import BaseBlock from '@/components/organisms/blocks/base-block/BaseBlock';
import { generateGalleryArchiveMetadata } from '@/lib/data/gallery-archive-metadata';
import { getCachedCollection } from '@/lib/data/payload/get-cached-collection';
import { getGalleryArchive } from '@/lib/data/payload/get-gallery-archive';
import { assertLocale } from '@/lib/utilities/assert-locale';

type Props = {
    params: Promise<{
        locale: string;
        tag: string;
    }>;
};

export default async function GalleryArchivePage({ params: paramsPromise }: Props) {
    const { locale, tag } = await paramsPromise;

    assertLocale(locale);
    setRequestLocale(locale);

    const archive = await getGalleryArchive(tag, locale);
    if (!archive) return notFound();
    const t = await getTranslations({ locale, namespace: 'galleryArchive' });

    const galleries = await getCachedCollection({
        collection: 'galleries',
        locale,
        whereFields: archive.galleryWhere,
        limit: 100,
        depth: 2,
        sort: '-date',
    });
    const sortedGalleries = [...galleries.docs].sort((first, second) => {
        const firstDate = Date.parse(first.date ?? '');
        const secondDate = Date.parse(second.date ?? '');
        if (Number.isNaN(firstDate)) return Number.isNaN(secondDate) ? 0 : 1;
        if (Number.isNaN(secondDate)) return -1;
        return secondDate - firstDate;
    });

    return (
        <article>
            <BaseBlock className="mt-md flex flex-col gap-md md:gap-lg lg:mt-2xl">
                <h1 className="heading-1">{archive.title}</h1>
                {galleries.docs.length === 0 && <p className="body-md">{t('empty')}</p>}
                <ul className="grid gap-x-base gap-y-lg sm:grid-cols-2 lg:grid-cols-3">
                    {sortedGalleries.map((gallery) => (
                        <li key={gallery.id}>
                            <GalleryCard data={gallery} locale={locale} />
                        </li>
                    ))}
                </ul>
            </BaseBlock>
        </article>
    );
}

export async function generateMetadata({ params: paramsPromise }: Props): Promise<Metadata> {
    const { locale, tag } = await paramsPromise;
    assertLocale(locale);
    const archive = await getGalleryArchive(tag, locale);
    if (!archive) return notFound();
    return generateGalleryArchiveMetadata(archive, locale);
}

export const dynamic = 'force-static';
