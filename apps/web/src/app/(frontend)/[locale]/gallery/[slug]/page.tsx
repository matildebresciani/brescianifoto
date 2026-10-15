import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import Gallery from '@/components/molecules/frontend/Gallery';
import GalleryHero from '@/components/molecules/frontend/GalleryHero';
import BaseBlock from '@/components/organisms/blocks/base-block/BaseBlock';
import { getCachedEntryBySlug } from '@/lib/data/payload/get-cached-entry-by-slug';
import { assertLocale } from '@/lib/utilities/assert-locale';
import { formatLinkByCollection } from '@/lib/utilities/format-link';
import { payloadRedirects } from '@/lib/utilities/payload-redirects';

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
    if (!gallery) {
        const path = formatLinkByCollection(slug, 'galleries', locale);
        if (path) await payloadRedirects(path);
        return notFound();
    }

    return (
        <article>
            <GalleryHero data={gallery} />

            <BaseBlock classNameOuter="pt-0">
                <Gallery images={gallery.gallery} />
            </BaseBlock>
        </article>
    );
}

export const dynamic = 'force-static';
