import { RenderBlocks } from '@/components/organisms/blocks/RenderBlocks';
import { defaultLocale } from '@/i18n/localized-collections';
import { getCachedEntryById } from '@/lib/data/payload/get-cached-entry-by-id';
import type { BC } from '@/lib/types/block-props';
import { getPayloadId } from '@/lib/utilities/composables';
import type { SavedLayoutsBlock as SavedLayoutsBlockProps } from '@/payload-types';

const SavedLayoutsBlock: BC<SavedLayoutsBlockProps> = async ({ block, locale = defaultLocale, pageId }) => {
    const { savedLayout } = block;

    if (!savedLayout) return null;

    const savedLayoutId = getPayloadId(savedLayout);

    const fetchedLayout = await getCachedEntryById({
        collection: 'saved-layout',
        id: savedLayoutId,
        locale,
        publicOnly: false,
    });

    if (!fetchedLayout?.layout) return null;

    return <RenderBlocks pageId={pageId} blocks={fetchedLayout.layout} locale={locale} />;
};

export default SavedLayoutsBlock;
