import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import Gallery from '@/components/molecules/frontend/Gallery';
import GalleryHero from '@/components/molecules/frontend/GalleryHero';
import BaseBlock from '@/components/organisms/blocks/base-block/BaseBlock';
import { getCachedEntryBySlug } from '@/lib/data/payload/get-cached-entry-by-slug';
import { assertLocale } from '@/lib/utilities/assert-locale';

type Props = {
    params: Promise<{
        locale: string;
        slug: string;
    }>;
};

export default async function GallerySinglePage({ params: paramsPromise }: Props) {
    const { locale, slug } = await paramsPromise;

    assertLocale(locale);
    setRequestLocale(locale);

    const gallery = await getCachedEntryBySlug({ collection: 'galleries', slug, locale });
    if (!gallery) return notFound();

    return (
        <article>
            <GalleryHero data={gallery} locale={locale} />

            <BaseBlock>
                <Gallery images={gallery.gallery} />
            </BaseBlock>
        </article>
    );
}

export const dynamic = 'force-static';
