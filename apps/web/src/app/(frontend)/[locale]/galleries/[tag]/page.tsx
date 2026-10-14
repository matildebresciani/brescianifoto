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

    return (
        <article>
            <BaseBlock className="mt-6 lg:mt-16">
                <div>
                    <h1 className="heading-1">{archive.title}</h1>
                </div>
            </BaseBlock>

            <BaseBlock className="mt-6 lg:mt-10">
                {galleries.docs.length === 0 && <p className="body-md">{t('empty')}</p>}
                <ul className="grid gap-base sm:grid-cols-2 lg:grid-cols-3">
                    {galleries.docs.map((gallery) => (
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
