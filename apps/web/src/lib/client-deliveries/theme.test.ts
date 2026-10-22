import { describe, expect, it } from 'vitest';
import {
    assignHighlightKeys,
    assignPaletteKeys,
    colorLibraryTheme,
    type DeliveryTheme,
    editorTheme,
    galleryPalette,
    libraryPalette,
    newHighlightKey,
    resolveSectionTheme,
    resolveThemeColors,
    sectionColorIssues,
    themeDefaults,
    themeIssues,
    themeReferenceIssues,
    themeSchema,
    themeStyle,
} from './theme';

const wedding: DeliveryTheme = {
    background: '#E9E9C7',
    surface: '#E9E9C7',
    text: '#30673A',
    muted: '#30673A',
    border: '#30673A',
    bgInvert: '#30673A',
    fgOnColor: '#E9E9C7',
    highlights: [
        { id: 'orange-row', key: 'tangerine', name: 'Tangerine', background: '#E3792F', text: '#151611' },
        { id: 'green-row', key: 'retro-green', name: 'Retro green', background: '#30673A', text: '#E9E9C7' },
    ],
};

describe('gallery semantic palette', () => {
    it('keeps the live palette available while an additional highlight row is incomplete', () => {
        const input = { ...wedding, background: '#FFFFEE', highlights: [...(wedding.highlights ?? []), { name: '' }] };
        expect(themeSchema.safeParse(input).success).toBe(false);
        const preview = editorTheme(input, wedding);
        expect(resolveThemeColors(preview).background).toBe('#FFFFEE');
        expect(preview.highlights).toHaveLength(2);
        expect(galleryPalette(preview).find((entry) => entry.value === 'bg-highlight-tangerine')?.color).toBe(
            '#E3792F',
        );
    });
    it('retains neutral defaults and derives inverse colors for legacy documents', () => {
        expect(themeSchema.parse({})).toEqual(themeDefaults);
        const palette = galleryPalette(themeDefaults);
        expect(palette.find((entry) => entry.value === 'bg-invert')).toMatchObject({
            color: themeDefaults.text,
            foreground: themeDefaults.background,
        });
        expect(themeStyle(themeDefaults)['--fg-on-color']).toBe(themeDefaults.background);
    });

    it('generates unique stable keys and preserves them across rename, reorder and key edits', () => {
        const renamed = assignHighlightKeys(
            {
                ...wedding,
                highlights: [
                    {
                        ...wedding.highlights?.[1],
                        id: 'green-row',
                        key: 'changed',
                        name: 'Forest',
                        background: '#30673A',
                        text: '#E9E9C7',
                    },
                    { id: 'new-row', key: 'tangerine', name: 'Tangerine', background: '#E3792F', text: '#151611' },
                    { id: 'orange-row', name: 'Sunset', background: '#E3792F', text: '#151611' },
                ],
            },
            wedding,
        );
        expect(renamed.highlights?.map((entry) => entry.key)).toEqual(['retro-green', 'tangerine-2', 'tangerine']);
        expect(newHighlightKey('Grøn & crème', ['gr-n-creme'])).toBe('gr-n-creme-2');
        expect(
            assignHighlightKeys({
                ...themeDefaults,
                highlights: [{ name: 'Tangerine', background: '#E3792F', text: '#151611' }],
            }).highlights?.[0]?.key,
        ).toBe('tangerine');
    });

    it('pairs automatic text with each highlight and allows explicit overrides', () => {
        for (const highlight of wedding.highlights ?? []) {
            const section = resolveSectionTheme(wedding, {
                backgroundSource: `bg-highlight-${highlight.key}`,
                textSource: 'automatic',
            });
            expect(section.theme.background).toBe(highlight.background);
            expect(section.theme.text).toBe(highlight.text);
            expect(themeIssues(section.theme)).toEqual([]);
            expect(themeStyle(section.theme)['--color-fg-faded']).toBe(highlight.text);
            expect(themeStyle(section.theme)['--fg-on-color']).toBe(highlight.background);
        }
        const override = resolveSectionTheme(wedding, {
            backgroundSource: 'bg-highlight-tangerine',
            textSource: 'custom',
            text: '#000000',
        });
        expect(override.theme.text).toBe('#000000');
        expect(
            resolveSectionTheme(wedding, { backgroundSource: 'bg-invert', textSource: 'automatic' }).theme.text,
        ).toBe('#E9E9C7');
        expect(
            resolveSectionTheme(wedding, { backgroundSource: 'bg-subtle', textSource: 'automatic' }).theme.text,
        ).toBe('#30673A');
    });

    it('preserves explicit inheritance and old missing-source custom colors', () => {
        expect(
            resolveSectionTheme(wedding, { backgroundSource: 'bg-highlight-tangerine', textSource: 'inherit' }).theme
                .text,
        ).toBe(wedding.text);
        expect(resolveSectionTheme(wedding, { backgroundSource: 'bg-highlight-tangerine' }).theme.text).toBe(
            wedding.text,
        );
        expect(resolveSectionTheme(wedding, { background: '#000000', text: '#FFFFFF' }).theme).toMatchObject({
            background: '#000000',
            text: '#FFFFFF',
        });
        expect(
            resolveSectionTheme(wedding, { backgroundSource: 'text', textSource: 'background' }).theme,
        ).toMatchObject({ background: wedding.text, text: wedding.background });
    });

    it('updates token selections with palette edits without changing adjacent inherited sections', () => {
        const changed = {
            ...wedding,
            highlights: [
                { id: 'orange-row', key: 'tangerine', name: 'Tangerine', background: '#FFAA66', text: '#151611' },
            ],
        };
        expect(
            resolveSectionTheme(changed, { backgroundSource: 'bg-highlight-tangerine', textSource: 'automatic' }).theme
                .background,
        ).toBe('#FFAA66');
        expect(resolveSectionTheme(changed, undefined).theme).toBe(changed);
        expect(galleryPalette(changed).find((entry) => entry.value === 'bg-highlight-tangerine')?.color).toBe(
            '#FFAA66',
        );
    });

    it('rejects deleted/unknown references, invalid CSS and automatic backgrounds', () => {
        const reference = { backgroundSource: 'bg-highlight-tangerine', textSource: 'automatic' };
        expect(sectionColorIssues(wedding, reference)).toEqual([]);
        expect(sectionColorIssues({ ...wedding, highlights: [] }, reference)[0]).toContain(
            'bg-highlight-tangerine is missing',
        );
        expect(sectionColorIssues(wedding, { textSource: 'fg-highlight-missing' })[0]).toContain(
            'fg-highlight-missing',
        );
        expect(sectionColorIssues(wedding, { backgroundSource: 'automatic' })).not.toEqual([]);
        expect(sectionColorIssues(wedding, { textSource: 'url(evil)' })).not.toEqual([]);
        expect(themeSchema.safeParse({ ...wedding, bgInvert: 'red;display:none' }).success).toBe(false);
    });

    it('validates used combinations and filled controls rather than every palette cross-product', () => {
        expect(themeIssues(wedding)).toEqual([]);
        const invalid = resolveSectionTheme(wedding, {
            backgroundSource: 'bg-highlight-tangerine',
            textSource: 'fg-on-color',
        });
        expect(themeIssues(invalid.theme).length).toBeGreaterThan(0);
        expect(themeIssues({ ...wedding, fgOnColor: '#30673A' })).toContain(
            'fg-on-color on bg-invert: 1.00:1 (needs 4.5:1).',
        );
    });
});

describe('reusable independent gallery colors', () => {
    const palette: DeliveryTheme = {
        ...themeDefaults,
        background: 'color-pistachio',
        surface: 'color-pistachio',
        text: 'color-green',
        muted: 'color-green',
        border: 'color-green',
        bgInvert: 'color-green',
        fgOnColor: 'color-pistachio',
        colors: [
            { id: 'orange', key: 'orange', name: 'Tangerine', hex: '#E3792F' },
            { id: 'green', key: 'green', name: 'Retro green', hex: '#30673A' },
            { id: 'cream', key: 'pistachio', name: 'Soft pistachio', hex: '#E9E9C7' },
        ],
    };
    it('defines each hex once and reuses it for multiple semantic roles and both section selectors', () => {
        expect(themeSchema.safeParse(palette).success).toBe(true);
        expect(themeIssues(palette)).toEqual([]);
        expect(themeStyle(palette)['--bg-base']).toBe('#E9E9C7');
        expect(themeStyle(palette)['--fg-on-color']).toBe('#E9E9C7');
        expect(
            resolveSectionTheme(palette, { backgroundSource: 'color-green', textSource: 'color-pistachio' }).theme,
        ).toMatchObject({ background: '#30673A', text: '#E9E9C7' });
        const updated = {
            ...palette,
            colors: palette.colors?.map((entry) => (entry.key === 'green' ? { ...entry, hex: '#224422' } : entry)),
        };
        expect(themeStyle(updated)['--fg-base']).toBe('#224422');
        expect(themeStyle(updated)['--border-base']).toBe('#224422');
        expect(resolveSectionTheme(updated, { textSource: 'color-green' }).theme.text).toBe('#224422');
    });
    it('deduplicates legacy pairs and base tokens while preserving colors and automatic text', () => {
        const adapted = colorLibraryTheme(wedding);
        expect(adapted.colors).toHaveLength(4);
        expect(new Set(adapted.colors?.map((entry) => entry.hex.toUpperCase())).size).toBe(4);
        expect(themeStyle(adapted)).toMatchObject(themeStyle(wedding));
        for (const key of ['tangerine', 'retro-green']) {
            const selection = { backgroundSource: `bg-highlight-${key}`, textSource: 'automatic' };
            const before = resolveSectionTheme(wedding, selection);
            const after = resolveSectionTheme(adapted, selection);
            expect(after.theme.background).toBe(before.theme.background);
            expect(after.theme.text).toBe(before.theme.text);
        }
        expect(colorLibraryTheme(adapted)).toBe(adapted);
    });
    it('preserves color references when names or order change, and accepts an independent new color', () => {
        const edited = assignPaletteKeys(
            {
                ...palette,
                colors: [...(palette.colors ?? [])]
                    .reverse()
                    .map((entry) => ({ ...entry, name: `New ${entry.name}`, key: 'attempted-edit' })),
            },
            palette,
        );
        expect(edited.colors?.map((entry) => entry.key)).toEqual(['pistachio', 'green', 'orange']);
        expect(libraryPalette(edited)[0]?.label).toBe('#E9E9C7');
        expect(
            assignPaletteKeys({ ...themeDefaults, colors: [{ name: 'Evening', hex: '#112233' }] }).colors?.[0]?.key,
        ).toBe('evening');
    });
    it('prevents removing colors used by tokens or sections, but permits removing unused colors', () => {
        const removed = { ...palette, colors: palette.colors?.filter((entry) => entry.key !== 'green') };
        expect(themeReferenceIssues(removed).length).toBeGreaterThan(0);
        expect(sectionColorIssues(removed, { backgroundSource: 'color-green' })[0]).toContain('color-green');
        const noOrange = { ...palette, colors: palette.colors?.filter((entry) => entry.key !== 'orange') };
        expect(themeReferenceIssues(noOrange)).toEqual([]);
        expect(themeIssues(noOrange)).toEqual([]);
        expect(themeSchema.safeParse({ ...palette, colors: [{ name: 'Bad', hex: 'url(evil)' }] }).success).toBe(false);
    });
    it('keeps existing colors selectable while another row is incomplete', () => {
        const edited = editorTheme({ ...palette, colors: [...(palette.colors ?? []), { name: '' }] }, palette);
        expect(libraryPalette(edited)).toHaveLength(3);
        expect(resolveThemeColors(edited).background).toBe('#E9E9C7');
    });
    it('creates nameless colors with unique variables that survive hex edits, reorder and reload', () => {
        const parsed = themeSchema.parse({
            ...themeDefaults,
            colors: [
                { id: 'first', hex: '#112233' },
                { id: 'second', hex: '#112233', name: null },
            ],
        });
        const initial = assignPaletteKeys(parsed);
        expect(initial.colors?.map((entry) => entry.key)).toEqual(['112233', '112233-2']);
        const edited = assignPaletteKeys(
            {
                ...initial,
                text: 'color-112233',
                colors: [...(initial.colors ?? [])].reverse().map((entry) => ({ ...entry, hex: '#223344' })),
            },
            initial,
        );
        const reloaded = themeSchema.parse(JSON.parse(JSON.stringify(edited)));
        expect(reloaded.colors?.map((entry) => entry.key)).toEqual(['112233-2', '112233']);
        expect(libraryPalette(reloaded)[1]).toEqual({
            value: 'color-112233',
            label: '#223344',
            color: '#223344',
        });
        expect(themeStyle(reloaded)['--fg-base']).toBe('#223344');
        expect(resolveSectionTheme(reloaded, { textSource: 'color-112233' }).theme.text).toBe('#223344');
        const removed = { ...reloaded, colors: reloaded.colors?.filter((entry) => entry.key !== '112233') };
        expect(themeReferenceIssues(removed)).not.toEqual([]);
        expect(sectionColorIssues(removed, { textSource: 'color-112233' })).not.toEqual([]);
    });
});
