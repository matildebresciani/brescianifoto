import { z } from 'zod';

export * from './theme';

export function relationshipID(value: unknown): string | undefined {
    if (typeof value === 'string') return value;
    const parsed = z.object({ id: z.string() }).safeParse(value);
    return parsed.success ? parsed.data.id : undefined;
}

export const sectionSchema = z.object({
    blockType: z.literal('photos'),
    id: z.string().optional(),
    anchor: z.string().optional().nullable(),
    title: z.string(),
    menuLabel: z.string().optional().nullable(),
    introduction: z.unknown().optional(),
    colors: z.unknown().optional(),
    photos: z.array(z.unknown()).optional().nullable(),
    blockName: z.string().optional().nullable(),
});

/** Deduplication means moving or reordering a photo does not invalidate a ZIP. */
export function selectedPhotoIDs(blocks: unknown): string[] {
    if (!Array.isArray(blocks)) return [];
    return [
        ...new Set(
            blocks.flatMap((block) => {
                const parsed = sectionSchema.safeParse(block);
                if (!parsed.success) return [];
                return (parsed.data.photos ?? []).flatMap((photo) => {
                    const id = relationshipID(photo);
                    return id ? [id] : [];
                });
            }),
        ),
    ].sort();
}

export function formatBytes(bytes: number): string {
    if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
    return `${Math.max(0.1, bytes / 1024 ** 2).toFixed(1)} MB`;
}

export const uploadPartSize = 16 * 1024 * 1024;
export const maxPhotoBytes = 50 * 1024 * 1024;
export const maxArchiveBytes = 25 * 1024 ** 3;
