'use client';

import { useFormFields } from '@payloadcms/ui';
import type { UIFieldClientProps } from 'payload';
import {
    resolveSectionTheme,
    sectionColorsSchema,
    themeDefaults,
    themeIssues,
    themeSchema,
} from '@/lib/client-deliveries/shared';

export function SectionColorFeedback({ path }: UIFieldClientProps) {
    const prefix = path.slice(0, path.lastIndexOf('.'));
    const values = useFormFields(([fields]) => ({
        gallery: Object.fromEntries(
            Object.entries(themeDefaults).map(([key, fallback]) => [key, fields[`theme.${key}`]?.value ?? fallback]),
        ),
        colors: Object.fromEntries(
            ['background', 'text', 'backgroundSource', 'textSource'].map((key) => [
                key,
                fields[`${prefix}.${key}`]?.value,
            ]),
        ),
    }));
    const gallery = themeSchema.safeParse(values.gallery);
    const colors = sectionColorsSchema.safeParse(values.colors);
    const issues =
        gallery.success && colors.success
            ? themeIssues(resolveSectionTheme(gallery.data, colors.data).theme)
            : ['Choose a six-digit hex value for each custom color.'];
    const resolved =
        gallery.success && colors.success ? resolveSectionTheme(gallery.data, colors.data).theme : undefined;
    return (
        <div aria-live="polite">
            {resolved && (
                <p
                    style={{
                        backgroundColor: resolved.background,
                        color: resolved.text,
                        padding: '16px',
                        border: '1px solid var(--theme-elevation-300)',
                    }}
                >
                    Section color preview · {resolved.background} / {resolved.text}
                </p>
            )}
            <p>{issues.length ? issues.join(' ') : 'Section text meets 4.5:1 contrast on its background.'}</p>
        </div>
    );
}
