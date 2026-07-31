// TODO: Unsure if used in admin or only in frontend... If only used in frontend then just delete it
import type { DefaultNodeTypes, SerializedLinkNode } from '@payloadcms/richtext-lexical';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import {
    type JSXConvertersFunction,
    LinkJSXConverter,
    RichText as RichTextWithoutBlocks,
} from '@payloadcms/richtext-lexical/react';

import { cn } from '@/lib/utilities/ui';

type NodeTypes = DefaultNodeTypes;

const internalDocToHref = ({ linkNode }: { linkNode: SerializedLinkNode }) => {
    const doc = linkNode.fields.doc;
    if (!doc) {
        throw new Error('Expected doc to be defined');
    }
    const { value, relationTo } = doc;
    if (typeof value !== 'object') {
        throw new Error('Expected value to be an object');
    }
    const slug = value.slug;
    return relationTo === 'posts' ? `/posts/${slug}` : `/${slug}`;
};

const jsxConverters: JSXConvertersFunction<NodeTypes> = ({ defaultConverters }) => ({
    ...defaultConverters,
    ...LinkJSXConverter({ internalDocToHref }),
});

type Props = {
    data: SerializedEditorState;
    enableGutter?: boolean;
    enableProse?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

export default function RichText(props: Props) {
    const { className, enableProse = true, enableGutter = true, ...rest } = props;
    return (
        <RichTextWithoutBlocks
            converters={jsxConverters}
            className={cn(
                {
                    'container ': enableGutter,
                    'max-w-none': !enableGutter,
                    'mx-auto prose md:prose-md dark:prose-invert ': enableProse,
                },
                className,
            )}
            {...rest}
        />
    );
}
