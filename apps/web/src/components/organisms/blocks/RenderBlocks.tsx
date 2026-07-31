import type React from 'react';
import { Fragment } from 'react';
import EmbedBlock from '@/collections/embed/Embed';
import type { Locale, RoutedCollectionSlug } from '@/i18n/localized-collections';
import type { Page, Post } from '@/payload-types';
import DividerBlock from './divider/Divider';
import HeroBlock from './hero/Hero';
import ParagraphBlock from './paragraph/Paragraph';
import SavedLayoutsBlock from './saved-layouts/SavedLayouts';
import TextImageBlock from './text-image/TextImage';

const blockComponents = {
    hero: HeroBlock,
    paragraph: ParagraphBlock,
    'text-image': TextImageBlock,
    divider: DividerBlock,
    'saved-layouts': SavedLayoutsBlock,
    embed: EmbedBlock,
};

export const RenderBlocks: React.FC<{
    pageId: string;
    blocks: NonNullable<Page['layout'] | Post['layout']>[0][];
    locale?: Locale;
    collectionType?: RoutedCollectionSlug;
}> = (props) => {
    const { pageId, blocks, locale, collectionType } = props;

    const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0;

    if (hasBlocks) {
        return (
            <Fragment>
                {blocks.map((block, index) => {
                    const { blockType } = block;

                    if (blockType && blockType in blockComponents) {
                        const Block = blockComponents[blockType];

                        if (Block) {
                            return (
                                <Block
                                    // biome-ignore lint/suspicious/noArrayIndexKey: This should be fine for render blocks as they do not really change while in use
                                    key={index}
                                    pageId={pageId}
                                    // @ts-expect-error
                                    block={block}
                                    locale={locale}
                                    collectionType={collectionType}
                                />
                            );
                        }
                    }
                    console.warn(`Block type "${blockType}" not found in blockComponents`);
                    return null;
                })}
            </Fragment>
        );
    }

    return null;
};
