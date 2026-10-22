'use client';

import { useDocumentInfo, useFormFields } from '@payloadcms/ui';
import type { FormState } from 'payload';
import { reduceFieldsToValues } from 'payload/shared';
import { z } from 'zod';
import { editorTheme, themeSchema } from '@/lib/client-deliveries/theme';

/** Reconstruct array rows from Payload's current flattened form state, including unsaved edits. */
export function themeFormValue(fields: FormState): Record<string, unknown> {
    const values = reduceFieldsToValues(
        Object.fromEntries(Object.entries(fields).filter(([path]) => path.startsWith('theme.'))),
        true,
    );
    const theme = z.record(z.string(), z.unknown()).safeParse(values.theme).data ?? {};
    // Payload represents an empty array by its row count in flattened form state.
    if (theme.colors === 0) theme.colors = [];
    return theme;
}

export function useGalleryTheme() {
    const formValue = useFormFields(([fields]) => themeFormValue(fields));
    const { data } = useDocumentInfo();
    const previous = themeSchema.safeParse(data?.theme ?? {});
    // Hidden legacy pairs have no editable rows; retain their saved values instead of Payload's row count.
    const value = { ...formValue, highlights: previous.data?.highlights };
    const parsed = themeSchema.safeParse(value);
    const theme = editorTheme(value, previous.data);
    return {
        parsed,
        theme,
    };
}

const sectionIdentity = z.object({ id: z.string().optional() });

export function useSectionColors(prefix: string) {
    const { data } = useDocumentInfo();
    const values = useFormFields(([fields]) => ({
        id: fields[`${prefix.slice(0, prefix.lastIndexOf('.'))}.id`]?.value,
        colors: Object.fromEntries(
            ['background', 'text', 'backgroundSource', 'textSource'].map((key) => [
                key,
                fields[`${prefix}.${key}`]?.value,
            ]),
        ),
    }));
    const blocks = z.array(sectionIdentity).safeParse(data?.blocks ?? []);
    const isExisting = blocks.success && Boolean(values.id) && blocks.data.some((block) => block.id === values.id);
    return !isExisting && !values.colors.textSource && !values.colors.text
        ? { ...values.colors, textSource: 'inherit' }
        : values.colors;
}
