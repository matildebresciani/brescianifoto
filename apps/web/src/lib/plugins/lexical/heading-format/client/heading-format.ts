'use client';
import type { ToolbarGroup } from '@payloadcms/richtext-lexical';
import { createClientFeature } from '@payloadcms/richtext-lexical/client';
import { $getSelection, $isRangeSelection, $isTextNode } from 'lexical';
import { AddIcon } from '@/components/atoms/admin/icons/Add';

const toolbarGroups: ToolbarGroup[] = [
    {
        type: 'dropdown',
        ChildComponent: AddIcon,
        items: [
            {
                ChildComponent: AddIcon,
                isActive: ({ selection }) => {
                    if (!$isRangeSelection(selection)) {
                        return false;
                    }
                    return true;
                },
                key: 'heading-1',
                label: 'H1',
                onSelect: ({ editor }) => {
                    editor.update(() => {
                        const selection = $getSelection();

                        if ($isRangeSelection(selection)) {
                            const nodes = selection.getNodes();

                            nodes.forEach((node) => {
                                if ($isTextNode(node)) {
                                    node.setStyle('font-size:3rem;');
                                }
                            });
                        }
                    });
                },
                order: 1,
            },
        ],
        key: 'add',
        order: 30,
    },
];

export const HeadingFormatFeatureClient = createClientFeature({
    toolbarFixed: {
        groups: toolbarGroups,
    },
    toolbarInline: {
        groups: toolbarGroups,
    },
});
