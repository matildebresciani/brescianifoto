import type { DefaultNodeTypes, SerializedLinkNode } from '@payloadcms/richtext-lexical';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import {
    type JSXConvertersFunction,
    LinkJSXConverter,
    RichText as RichTextWithoutBlocks,
} from '@payloadcms/richtext-lexical/react';
import { createElement, type HTMLAttributes } from 'react';
import { z } from 'zod';

import { cn } from '@/lib/utilities/ui';

type NodeTypes = DefaultNodeTypes;

const internalDocToHref = ({ linkNode }: { linkNode: SerializedLinkNode }) => {
    const doc = linkNode.fields.doc;
    if (!doc) return linkNode.fields.url || '#';
    const { value, relationTo } = doc;
    if (typeof value !== 'object') return linkNode.fields.url || '#';
    const slug = value.slug;
    return relationTo === 'posts' ? `/posts/${slug}` : `/${slug}`;
};

const metadataState = z.object({ $: z.object({ deliveryStyle: z.literal('metadata') }) });

const jsxConverters =
    (isDelivery: boolean): JSXConvertersFunction<NodeTypes> =>
    ({ defaultConverters }) => {
        const convertText = defaultConverters.text;

        return {
            ...defaultConverters,
            ...LinkJSXConverter({ internalDocToHref }),
            text: (args) => {
                if (typeof convertText !== 'function') return convertText ?? args.node.text;

                // Old editor content can contain fixed sizes; presentation now comes from the fluid roles.
                const style = args.node.style
                    .split(';')
                    .filter((declaration) => !/^\s*font-size\s*:/i.test(declaration))
                    .join(';');

                const text = convertText({ ...args, node: { ...args.node, style } });
                return isDelivery && metadataState.safeParse(args.node).success
                    ? createElement('span', { 'data-delivery-style': 'metadata' }, text)
                    : text;
            },
        };
    };

type Props = {
    /** Saved content is rendered without changing its text, structure, or stored formatting. */
    data: SerializedEditorState;
    /** Preserve the existing optional layout gutter around rich text. */
    enableGutter?: boolean;
    /** Apply the shared fluid body and rich-text styles. */
    enableProse?: boolean;
    /** Use the client-gallery font roles and authored case, including explicit metadata marks. */
    isDelivery?: boolean;
} & HTMLAttributes<HTMLDivElement>;

export default function RichText(props: Props) {
    const { className, enableProse = true, enableGutter = true, isDelivery = false, ...rest } = props;
    return createElement(RichTextWithoutBlocks, {
        converters: jsxConverters(isDelivery),
        className: cn(
            {
                'container ': enableGutter,
                'max-w-none': !enableGutter,
                'mx-auto body-md wysiwyg': enableProse,
                'delivery-rich-text': isDelivery,
            },
            className,
        ),
        ...rest,
    });
}
