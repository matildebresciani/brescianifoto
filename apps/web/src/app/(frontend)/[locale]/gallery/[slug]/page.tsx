import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import BackLink from '@/components/atoms/frontend/links/BackLink';
import Gallery from '@/components/molecules/frontend/Gallery';
import GalleryHero from '@/components/molecules/frontend/GalleryHero';
import BaseBlock from '@/components/organisms/blocks/base-block/BaseBlock';
import { generateGalleryPageMetadata } from '@/lib/data/gallery-page-metadata';
import { getCachedEntryBySlug } from '@/lib/data/payload/get-cached-entry-by-slug';
import { assertLocale } from '@/lib/utilities/assert-locale';
import { payloadObject } from '@/lib/utilities/composables';
import { formatGalleryArchiveLink, formatLinkByCollection } from '@/lib/utilities/format-link';
import { getServerSideURL } from '@/lib/utilities/get-url';
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

    const group = payloadObject(gallery.tagGroup);
    const archiveLink = group?.hasArchivePage ? formatGalleryArchiveLink(group.slug, locale) : null;
    const archiveLabel =
        group?.slug === 'concerts' ? 'Concerts' : group?.slug === 'festivals' ? 'Festivals' : group?.title;
    const backLink = archiveLink && archiveLabel && <BackLink href={archiveLink} label={archiveLabel} />;

    return (
        <article>
            {backLink && <div className="base-block pt-lg md:pt-xl">{backLink}</div>}
            <GalleryHero data={gallery} />

            <BaseBlock classNameOuter="pt-0">
                <Gallery images={gallery.gallery} />
                {backLink && <div className="mt-lg">{backLink}</div>}
            </BaseBlock>
        </article>
    );
}

export const dynamic = 'force-static';

export async function generateMetadata({ params }: Props) {
    const { locale, slug } = await params;
    assertLocale(locale);
    const gallery = await getCachedEntryBySlug({ collection: 'galleries', slug, locale });
    return gallery ? generateGalleryPageMetadata(gallery, locale, getServerSideURL()) : {};
}
