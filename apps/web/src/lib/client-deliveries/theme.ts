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
const colorReference = z.string().regex(/^color-[a-z0-9]+(?:-[a-z0-9]+)*$/);
const colorValue = z.union([color, colorReference]);
const optionalColor = z
    .union([colorValue, z.literal('')])
    .nullable()
    .optional();
const highlightSchema = z.object({
    id: z.string().optional(),
    key: z
        .string()
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .or(z.literal(''))
        .nullable()
        .optional(),
    name: z.string().trim().min(1),
    background: colorValue,
    text: colorValue,
});

const paletteColorSchema = highlightSchema.omit({ background: true, text: true, name: true }).extend({
    name: z.string().nullable().optional(),
    hex: color,
});

export const themeSchema = z.object({
    background: colorValue.default(themeDefaults.background),
    surface: colorValue.default(themeDefaults.surface),
    text: colorValue.default(themeDefaults.text),
    muted: colorValue.default(themeDefaults.muted),
    border: colorValue.default(themeDefaults.border),
    bgInvert: optionalColor,
    fgOnColor: optionalColor,
    highlights: z.array(highlightSchema).nullable().optional(),
    colors: z.array(paletteColorSchema).nullable().optional(),
});
export type DeliveryTheme = z.infer<typeof themeSchema>;

/** Incomplete new rows must not hide the rest of the editor palette while a color is being edited. */
export function editorTheme(input: unknown, previous: DeliveryTheme = themeDefaults): DeliveryTheme {
    const base = themeSchema.omit({ highlights: true, colors: true }).safeParse(input);
    const rows = z.object({ highlights: z.array(z.unknown()).nullable().optional() }).safeParse(input);
    const highlights = rows.success
        ? (rows.data.highlights ?? []).flatMap((row) => {
              const entry = highlightSchema.safeParse(row);
              return entry.success ? [entry.data] : [];
          })
        : previous.highlights;
    const colorRows = z.object({ colors: z.array(z.unknown()).nullable().optional() }).safeParse(input);
    const colors =
        colorRows.success && colorRows.data.colors != null
            ? colorRows.data.colors.flatMap((row) => {
                  const entry = paletteColorSchema.safeParse(row);
                  return entry.success ? [entry.data] : [];
              })
            : previous.colors;
    return assignPaletteKeys(
        colorLibraryTheme({ ...(base.success ? base.data : previous), highlights, colors }),
        previous,
    );
}

/** Names are used only to create a key; persisted keys survive later name changes. */
export function newHighlightKey(name: string, used: Iterable<string>): string {
    const base =
        name
            .normalize('NFKD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '') || 'color';
    const keys = new Set(used);
    let key = base;
    let suffix = 2;
    while (keys.has(key)) key = `${base}-${suffix++}`;
    return key;
}

/** Match by Payload row ID so renames, reorder, and attempted key edits keep references stable. */
export function assignHighlightKeys(theme: DeliveryTheme, previous?: DeliveryTheme): DeliveryTheme {
    if (!theme.highlights) return theme;
    const prior = previous?.highlights ?? [];
    const reserved = theme.highlights.flatMap((entry) => {
        const old = entry.id ? prior.find((item) => item.id === entry.id) : undefined;
        return old?.key ? [old.key] : [];
    });
    const used = new Set(reserved);
    const highlights = theme.highlights.map((entry) => {
        const old = entry.id ? prior.find((item) => item.id === entry.id) : undefined;
        if (old?.key) return { ...entry, key: old.key };
        const key = entry.key && !used.has(entry.key) ? entry.key : newHighlightKey(entry.name, used);
        used.add(key);
        return { ...entry, key };
    });
    return { ...theme, highlights };
}

/** Reuse persisted variables, including names from legacy palettes; new colors need only a hex. */
export function assignPaletteKeys(theme: DeliveryTheme, previous?: DeliveryTheme): DeliveryTheme {
    const normalized = assignHighlightKeys(theme, previous);
    if (!normalized.colors) return normalized;
    const prior = previous?.colors ?? [];
    const used = new Set(
        normalized.colors.flatMap((entry) => {
            const old = entry.id ? prior.find((item) => item.id === entry.id) : undefined;
            return old?.key ? [old.key] : [];
        }),
    );
    return {
        ...normalized,
        colors: normalized.colors.map((entry) => {
            const old = entry.id ? prior.find((item) => item.id === entry.id) : undefined;
            if (old?.key) return { ...entry, key: old.key };
            const key = entry.key && !used.has(entry.key) ? entry.key : newHighlightKey(entry.name || entry.hex, used);
            used.add(key);
            return { ...entry, key };
        }),
    };
}

export const themeRoles: ('background' | 'surface' | 'text' | 'muted' | 'border' | 'bgInvert' | 'fgOnColor')[] = [
    'background',
    'surface',
    'text',
    'muted',
    'border',
    'bgInvert',
    'fgOnColor',
];

/** Lazily adapt old galleries without changing their appearance or requiring a database-wide migration. */
export function colorLibraryTheme(theme: DeliveryTheme): DeliveryTheme {
    if (theme.colors != null) return theme;
    const colors: NonNullable<DeliveryTheme['colors']> = [];
    const knownNames: Record<string, string> = {
        '#FAFFEF': 'Bone',
        '#F0F3E6': 'Paper',
        '#151611': 'Void',
        '#55584C': 'Fog',
        '#C4C8BB': 'Line',
    };
    const reference = (hex: string, name?: string) => {
        if (!color.safeParse(hex).success) return hex;
        const found = colors.find((entry) => entry.hex.toUpperCase() === hex.toUpperCase());
        if (found) return `color-${found.key}`;
        const label = name || knownNames[hex.toUpperCase()] || hex.toUpperCase();
        const key = newHighlightKey(
            label,
            colors.flatMap((entry) => (entry.key ? [entry.key] : [])),
        );
        colors.push({ name: label, key, hex });
        return `color-${key}`;
    };
    // Prefer authored highlight names over generated names when colors are shared with base tokens.
    const highlights = theme.highlights?.map((entry) => ({
        ...entry,
        background: reference(entry.background, entry.name),
        text: reference(entry.text),
    }));
    const result = { ...theme, colors, ...(highlights ? { highlights } : {}) };
    for (const role of themeRoles) {
        const hex = theme[role];
        if (hex) result[role] = reference(hex);
    }
    return result;
}

export function libraryPalette(theme: DeliveryTheme): PaletteOption[] {
    return (theme.colors ?? []).flatMap((entry) =>
        entry.key ? [{ value: `color-${entry.key}`, label: entry.hex.toUpperCase(), color: entry.hex }] : [],
    );
}

/** Resolve named colors without allowing token-to-token cycles. */
export function resolveThemeColors(theme: DeliveryTheme): DeliveryTheme {
    const resolve = (value: string) => libraryPalette(theme).find((entry) => entry.value === value)?.color || value;
    const result = { ...theme };
    for (const role of themeRoles) {
        const value = theme[role];
        if (value) result[role] = resolve(value);
    }
    if (theme.highlights)
        result.highlights = theme.highlights.map((entry) => ({
            ...entry,
            background: resolve(entry.background),
            text: resolve(entry.text),
        }));
    return result;
}

/** Reject removal of colors still used by semantic tokens. Section references are checked separately. */
export function themeReferenceIssues(theme: DeliveryTheme): string[] {
    const keys = new Set(libraryPalette(theme).map((entry) => entry.value));
    const values = themeRoles.map((role) => ({ label: role, value: theme[role] }));
    return values.flatMap(({ label, value }) =>
        value?.startsWith('color-') && !keys.has(value)
            ? [`${label} uses missing color ${value}. Choose another color before removing it.`]
            : [],
    );
}

export const paletteOptions = [
    { label: 'bg-base', value: 'background' },
    { label: 'bg-subtle', value: 'surface' },
    { label: 'fg-base', value: 'text' },
    { label: 'fg-faded', value: 'muted' },
    { label: 'border-base', value: 'border' },
];

const legacyTokens: Record<string, string> = Object.fromEntries(
    paletteOptions.map(({ value, label }) => [value, label]),
);
export const paletteToken = (source: string) => legacyTokens[source] ?? source;

export type PaletteOption = { value: string; label: string; color?: string; foreground?: string };

/** Resolved options are shared by the editor, server validation, and scoped CSS. */
export function galleryPalette(input: DeliveryTheme): PaletteOption[] {
    const theme = resolveThemeColors(input);
    return [
        ...libraryPalette(theme),
        { value: 'bg-base', label: 'bg-base', color: theme.background, foreground: theme.text },
        { value: 'bg-subtle', label: 'bg-subtle', color: theme.surface, foreground: theme.text },
        {
            value: 'bg-invert',
            label: 'bg-invert',
            color: theme.bgInvert || theme.text,
            foreground: theme.fgOnColor || theme.background,
        },
        { value: 'fg-base', label: 'fg-base', color: theme.text },
        { value: 'fg-faded', label: 'fg-faded', color: theme.muted },
        { value: 'fg-on-color', label: 'fg-on-color', color: theme.fgOnColor || theme.background },
        { value: 'border-base', label: 'border-base', color: theme.border },
        ...(theme.highlights ?? []).flatMap((entry) =>
            entry.key
                ? [
                      {
                          value: `bg-highlight-${entry.key}`,
                          label: entry.background.toUpperCase(),
                          color: entry.background,
                          foreground: entry.text,
                      },
                      { value: `fg-highlight-${entry.key}`, label: entry.text.toUpperCase(), color: entry.text },
                  ]
                : [],
        ),
    ];
}

const paletteSource = z
    .string()
    .refine(
        (value) =>
            [
                'inherit',
                'automatic',
                'custom',
                ...paletteOptions.map((option) => option.value),
                'bg-base',
                'bg-subtle',
                'bg-invert',
                'fg-base',
                'fg-faded',
                'fg-on-color',
                'border-base',
            ].includes(value) || /^(color-|(?:bg|fg)-highlight-)[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value),
        'Choose a valid color token.',
    );

export const sectionColorsSchema = z
    .object({
        background: z
            .union([color, z.literal('')])
            .nullable()
            .optional(),
        text: z
            .union([color, z.literal('')])
            .nullable()
            .optional(),
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
        if (colors.backgroundSource === 'automatic')
            context.addIssue({
                code: 'custom',
                path: ['backgroundSource'],
                message: 'Automatic is only available for text.',
            });
    });

/** Validate references even in drafts: removing a referenced highlight must never silently recolor a section. */
export function sectionColorIssues(theme: DeliveryTheme, input: unknown): string[] {
    const parsed = sectionColorsSchema.safeParse(input ?? {});
    if (!parsed.success) return parsed.error.issues.map((issue) => issue.message);
    const palette = galleryPalette(theme);
    const issues = [parsed.data.backgroundSource, parsed.data.textSource].flatMap((source) => {
        if (!source || ['inherit', 'automatic', 'custom'].includes(source)) return [];
        const option = palette.find((entry) => entry.value === paletteToken(source));
        return option && color.safeParse(option.color).success
            ? []
            : [`Color token ${source} is missing. Restore it or choose another color.`];
    });
    if (parsed.data.textSource === 'automatic') {
        const background = palette.find(
            (entry) => entry.value === paletteToken(parsed.data.backgroundSource || 'bg-base'),
        );
        if (background?.foreground && !color.safeParse(background.foreground).success)
            issues.push('The existing automatic text color is missing. Choose a text color.');
    }
    return issues;
}

/** Blank legacy overrides retain their behavior; only explicit automatic text follows the selected pair. */
export function resolveSectionTheme(input: DeliveryTheme, colors: unknown) {
    const hasReferences = themeRoles.some((role) => input[role]?.startsWith('color-'));
    const gallery = hasReferences ? resolveThemeColors(input) : input;
    const parsed = sectionColorsSchema.safeParse(colors ?? {});
    const overrides = parsed.success ? parsed.data : {};
    const palette = galleryPalette(gallery);
    const resolve = (source: string | null | undefined, custom: string | null | undefined, fallback: string) => {
        if (source === 'inherit') return fallback;
        if (!source || source === 'custom') return custom || fallback;
        return palette.find((option) => option.value === paletteToken(source))?.color || fallback;
    };
    const background = resolve(overrides.backgroundSource, overrides.background, gallery.background);
    const automaticText =
        palette.find((option) => option.value === paletteToken(overrides.backgroundSource || 'bg-base'))?.foreground ||
        gallery.text;
    const text =
        overrides.textSource === 'automatic'
            ? automaticText
            : resolve(overrides.textSource, overrides.text, gallery.text);
    const hasCustomColors = background !== gallery.background || text !== gallery.text;
    const theme: DeliveryTheme = hasCustomColors
        ? {
              ...gallery,
              background,
              text,
              surface: background,
              muted: text,
              border: text,
              bgInvert: text,
              fgOnColor: background,
          }
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

/** WCAG contrast for two opaque, validated theme colors. */
export function contrastRatio(first: string, second: string): number {
    const a = luminance(first);
    const b = luminance(second);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export function themeIssues(input: DeliveryTheme): string[] {
    const references = themeReferenceIssues(input);
    if (references.length) return references;
    const theme = resolveThemeColors(input);
    const pairs = [
        { bg: theme.background, fg: theme.text, label: 'fg-base on bg-base' },
        { bg: theme.surface, fg: theme.text, label: 'fg-base on bg-subtle' },
        { bg: theme.background, fg: theme.muted, label: 'fg-faded on bg-base' },
        { bg: theme.surface, fg: theme.muted, label: 'fg-faded on bg-subtle' },
    ];
    // Without explicit inverse colors this pair duplicates fg-base on bg-base.
    if (theme.bgInvert || theme.fgOnColor)
        pairs.push({
            bg: theme.bgInvert || theme.text,
            fg: theme.fgOnColor || theme.background,
            label: 'fg-on-color on bg-invert',
        });
    return pairs.flatMap(({ bg, fg, label }) => {
        const ratio = contrastRatio(fg, bg);
        return ratio < 4.5 ? [`${label}: ${ratio.toFixed(2)}:1 (needs 4.5:1).`] : [];
    });
}

/** Apply semantic tokens to the page and portal dialog without leaking into the public portfolio. */
export function themeStyle(input: DeliveryTheme, previous?: DeliveryTheme): CSSProperties & Record<string, string> {
    const theme = resolveThemeColors(input);
    const style: Record<string, string> = {
        '--delivery-previous-background': resolveThemeColors(previous ?? input).background,
        '--bone': theme.background,
        '--paper': theme.surface,
        '--void': theme.text,
        '--fog': theme.muted,
        '--line': theme.border,
        '--button-base': theme.bgInvert || theme.text,
        '--button-hovered': theme.bgInvert || theme.text,
    };
    const aliases = [
        ...galleryPalette(theme),
        { value: 'bg-pressed', color: theme.surface },
        { value: 'fg-subtle', color: theme.muted },
        { value: 'fg-highlight', color: theme.text },
        { value: 'border-focused', color: theme.text },
    ];
    for (const { value, color: hex } of aliases) {
        if (!hex) continue;
        style[`--${value}`] = hex;
        // Non-inline Tailwind aliases otherwise resolve at :root before this scope.
        style[`--color-${value}`] = hex;
    }
    return style;
}
