import type { Metadata } from 'next';
import { draftMode } from 'next/headers';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { LivePreviewListener } from '@/components/molecules/admin/LivePreviewListener';
import { RenderBlocks } from '@/components/organisms/blocks/RenderBlocks';
import { defaultLocale, type Locale } from '@/i18n/localized-collections';
import { generateEntryMetadata } from '@/lib/data/metadata';
import { getCachedEntryById } from '@/lib/data/payload/get-cached-entry-by-id';
import { getCachedEntryBySlug } from '@/lib/data/payload/get-cached-entry-by-slug';
import { getCachedOptions } from '@/lib/data/payload/get-cached-options';
import { assertLocale } from '@/lib/utilities/assert-locale';
import { payloadRedirects } from '@/lib/utilities/payload-redirects';
import type { Page as PageType } from '@/payload-types';

type Props = PageProps<'/[locale]/[[...slug]]'>;

const collection = 'pages';

export default async function Page({ params: paramsPromise }: Props) {
    const { isEnabled: draft } = await draftMode();
    const { slug: slugParam = [''], locale } = await paramsPromise;
    const slug = slugParam.join('/');

    assertLocale(locale);

    // Checking if there is a redirect from the Payload collection for the current slug
    await payloadRedirects(slug);

    const page = await isHomepage(slug, locale);
    if (!page) return notFound();

    setRequestLocale(locale);

    const { id, layout } = page;

    return (
        <>
            {draft && <LivePreviewListener />}

            <article>
                {layout && <RenderBlocks pageId={id} blocks={layout} locale={locale} collectionType="pages" />}
            </article>
        </>
    );
}

export const dynamic = 'force-static';

export const generateMetadata = async ({ params: paramsPromise }: Props): Promise<Metadata> => {
    const { slug: slugParam = [''], locale } = await paramsPromise;
    const slug = slugParam.join('/');

    assertLocale(locale);

    const page = await isHomepage(slug, locale);

    if (!page?.slug) return {};

    return generateEntryMetadata(page.slug, collection, locale);
};

const fetchHomepage = async (locale: Locale) => {
    const options = await getCachedOptions(locale);
    let homepageId: string | undefined;

    if (typeof options.defaultPages?.homepage === 'string') {
        homepageId = options.defaultPages.homepage;
    } else if (typeof options.defaultPages?.homepage === 'object') {
        homepageId = options.defaultPages?.homepage?.id;
    }

    if (!homepageId) notFound();

    const homepage = await getCachedEntryById({
        collection,
        id: homepageId,
        locale: locale ?? defaultLocale,
    });

    return homepage;
};

const isHomepage = async (slug: string, locale: Locale) => {
    let page: PageType | null | undefined;

    if (slug === '') {
        const fetchedHomepage = await fetchHomepage(locale);
        page = fetchedHomepage;
    } else {
        page = await getCachedEntryBySlug({ collection, slug, locale: locale });
    }

    return page;
};
