import type { CSSProperties } from 'react';
import { z } from 'zod';

export const themeDefaults = {
    background: '#FAFFEF',
    surface: '#F0F3E6',
    text: '#151611',
    muted: '#55584C',
    border: '#C4C8BB',
};

const color = z.string().regex(/^#[0-9a-f]{6}$/i, 'Use a six-digit hex color, such as #FAFFEF.');
export const themeSchema = z.object({
    background: color.default(themeDefaults.background),
    surface: color.default(themeDefaults.surface),
    text: color.default(themeDefaults.text),
    muted: color.default(themeDefaults.muted),
    border: color.default(themeDefaults.border),
});
export type DeliveryTheme = z.infer<typeof themeSchema>;

const optionalColor = z
    .union([color, z.literal('')])
    .nullable()
    .optional();
export const paletteOptions = [
    { label: 'Gallery background', value: 'background' },
    { label: 'Secondary surface', value: 'surface' },
    { label: 'Main text', value: 'text' },
    { label: 'Muted text', value: 'muted' },
    { label: 'Borders', value: 'border' },
];
const paletteSource = z.enum(['inherit', 'background', 'surface', 'text', 'muted', 'border', 'custom']);
export const sectionColorsSchema = z
    .object({
        background: optionalColor,
        text: optionalColor,
        backgroundSource: paletteSource.nullable().optional(),
        textSource: paletteSource.nullable().optional(),
    })
    .superRefine((colors, context) => {
        for (const role of ['background', 'text']) {
            const source = role === 'background' ? colors.backgroundSource : colors.textSource;
            const value = role === 'background' ? colors.background : colors.text;
            if (source === 'custom' && !value)
                context.addIssue({ code: 'custom', path: [role], message: 'Choose a custom color.' });
        }
    });

function resolveColor(
    gallery: DeliveryTheme,
    source: z.infer<typeof paletteSource> | null | undefined,
    custom: string | null | undefined,
    fallback: string,
) {
    if (source === 'inherit') return fallback;
    // Missing sources preserve hex overrides saved before palette references were introduced.
    if (!source || source === 'custom') return custom || fallback;
    return gallery[source];
}

/** Blank overrides inherit the gallery; custom sections derive all supporting roles from their two colors. */
export function resolveSectionTheme(gallery: DeliveryTheme, colors: unknown) {
    const parsed = sectionColorsSchema.safeParse(colors ?? {});
    const overrides = parsed.success ? parsed.data : {};
    const background = resolveColor(gallery, overrides.backgroundSource, overrides.background, gallery.background);
    const text = resolveColor(gallery, overrides.textSource, overrides.text, gallery.text);
    const hasCustomColors = background !== gallery.background || text !== gallery.text;
    const theme: DeliveryTheme = hasCustomColors
        ? { background, text, surface: background, muted: text, border: text }
        : gallery;
    return { theme, hasCustomColors };
}

function luminance(hex: string): number {
    const channels = [1, 3, 5].map((start) => {
        const value = Number.parseInt(hex.slice(start, start + 2), 16) / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    const [red = 0, green = 0, blue = 0] = channels;
    return red * 0.2126 + green * 0.7152 + blue * 0.0722;
}

/** WCAG contrast for the two opaque, validated theme colors. */
export function contrastRatio(first: string, second: string): number {
    const firstValue = luminance(first);
    const secondValue = luminance(second);
    return (Math.max(firstValue, secondValue) + 0.05) / (Math.min(firstValue, secondValue) + 0.05);
}

export function themeIssues(theme: DeliveryTheme): string[] {
    return ['background', 'surface'].flatMap((surface) => {
        const background = surface === 'background' ? theme.background : theme.surface;
        return ['text', 'muted'].flatMap((role) => {
            const foreground = role === 'text' ? theme.text : theme.muted;
            const ratio = contrastRatio(foreground, background);
            return ratio < 4.5 ? [`${role} on ${surface}: ${ratio.toFixed(2)}:1 (needs 4.5:1).`] : [];
        });
    });
}

/** Apply the same semantic tokens to the page and portal dialog. */
export function themeStyle(theme: DeliveryTheme): CSSProperties & Record<string, string> {
    return {
        '--bone': theme.background,
        '--paper': theme.surface,
        '--void': theme.text,
        '--fog': theme.muted,
        '--bg-base': theme.background,
        '--bg-subtle': theme.surface,
        '--bg-invert': theme.text,
        '--bg-pressed': theme.surface,
        '--fg-base': theme.text,
        '--fg-subtle': theme.muted,
        '--fg-faded': theme.muted,
        '--fg-on-color': theme.background,
        '--fg-highlight': theme.text,
        '--border-base': theme.border,
        '--border-focused': theme.text,
        '--button-base': theme.text,
        '--button-hovered': theme.text,
        '--line': theme.border,
        // Tailwind's non-inline color aliases otherwise resolve at :root before this scope.
        '--color-bg-base': theme.background,
        '--color-bg-subtle': theme.surface,
        '--color-bg-invert': theme.text,
        '--color-bg-pressed': theme.surface,
        '--color-fg-base': theme.text,
        '--color-fg-subtle': theme.muted,
        '--color-fg-faded': theme.muted,
        '--color-fg-on-color': theme.background,
        '--color-border-base': theme.border,
        '--color-border-focused': theme.text,
    };
}

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
