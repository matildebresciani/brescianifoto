import type { Metadata } from 'next';
import { draftMode } from 'next/headers';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { LivePreviewListener } from '@/components/molecules/admin/LivePreviewListener';
import { RenderBlocks } from '@/components/organisms/blocks/RenderBlocks';
import { generateEntryMetadata } from '@/lib/data/metadata';
import { getCachedEntryBySlug } from '@/lib/data/payload/get-cached-entry-by-slug';
import { assertLocale } from '@/lib/utilities/assert-locale';
import { formatLinkByCollection } from '@/lib/utilities/format-link';
import { payloadRedirects } from '@/lib/utilities/payload-redirects';

type Props = PageProps<'/[locale]/post/[slug]'>;

const collection = 'posts';

export default async function Page({ params: paramsPromise }: Props) {
    const { isEnabled: draft } = await draftMode();
    const { slug = '', locale } = await paramsPromise;

    assertLocale(locale);
    setRequestLocale(locale);

    // Checking if there is a redirect from the Payload collection for the current slug
    const formattedLink = formatLinkByCollection(slug, collection, locale);
    if (formattedLink) {
        await payloadRedirects(formattedLink);
    }

    const post = await getCachedEntryBySlug({ collection, slug, locale });

    if (!post) return notFound();

    const { id, layout } = post;

    return (
        <>
            {draft && <LivePreviewListener />}

            <article>
                {layout && <RenderBlocks pageId={id} blocks={layout} locale={locale} collectionType={collection} />}
            </article>
        </>
    );
}

export const dynamic = 'force-static';

export async function generateMetadata({ params: paramsPromise }: Props): Promise<Metadata> {
    const { slug, locale } = await paramsPromise;
    assertLocale(locale);

    if (!slug) notFound();

    return generateEntryMetadata(slug, collection, locale);
}
