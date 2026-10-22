import { z } from 'zod';

const textNode = z.object({
    type: z.string().optional(),
    text: z.string().optional(),
    root: z.unknown().optional(),
    children: z.array(z.unknown()).optional(),
});

function plainText(input: unknown): string {
    const node = textNode.safeParse(input);
    if (!node.success) return '';
    if (node.data.root) return plainText(node.data.root);
    return node.data.text ?? node.data.children?.map(plainText).join(node.data.type === 'root' ? ' ' : '') ?? '';
}

const section = z.object({
    blockType: z.string().optional(),
    blockName: z.string().nullable().optional(),
    title: z.string().nullable().optional(),
    photos: z.array(z.unknown()).nullable().optional(),
    content: z.unknown().optional(),
});

/** Labels are derived from current content without adding extra authoring fields. */
export function sectionRowLabel(input: unknown): string {
    const parsed = section.safeParse(input);
    if (!parsed.success) return 'Section';
    const { blockType, title, photos, blockName, content } = parsed.data;
    if (blockType === 'photos') {
        const count = photos?.length ?? 0;
        return `${title?.trim() || 'Photo section'} · ${count} ${count === 1 ? 'photo' : 'photos'}`;
    }
    const name = blockName?.trim();
    if (name) return name;
    const excerpt = plainText(content).replace(/\s+/g, ' ').trim();
    return excerpt ? `Text · ${excerpt.length > 80 ? `${excerpt.slice(0, 80).trimEnd()}…` : excerpt}` : 'Text section';
}
