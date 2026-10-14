import type { CheckboxField, TextField } from 'payload';

import { formatSlug, formatSlugHook } from './formatSlug';

type Overrides = {
    slugOverrides?: Partial<TextField>;
    checkboxOverrides?: Partial<CheckboxField>;
    shouldGenerateFromTitle?: boolean;
};

type Slug = (fieldToUse?: string, overrides?: Overrides) => [TextField, CheckboxField];

export const slugField: Slug = (fieldToUse = 'title', overrides = {}) => {
    const { slugOverrides, checkboxOverrides, shouldGenerateFromTitle = true } = overrides;

    const checkBoxField: CheckboxField = {
        name: 'slugLock',
        type: 'checkbox',
        defaultValue: true,
        admin: {
            hidden: true,
            position: 'sidebar',
        },
        ...checkboxOverrides,
    };

    // @ts-expect-error - ts mismatch Partial<TextField> with TextField
    const slugField: TextField = {
        name: 'slug',
        type: 'text',
        index: true,
        label: 'Slug',
        localized: true,
        ...(slugOverrides || {}),
        hooks: {
            // Kept this in for hook or API based updates
            beforeValidate: [
                shouldGenerateFromTitle
                    ? formatSlugHook(fieldToUse)
                    : ({ value }) => (typeof value === 'string' ? formatSlug(value) : value),
            ],
        },
        admin: {
            position: 'sidebar',
            ...(slugOverrides?.admin || {}),
            components: {
                Field: {
                    path: '@/components/molecules/admin/fields/slug/SlugComponent#SlugComponent',
                    clientProps: {
                        fieldToUse,
                        checkboxFieldPath: checkBoxField.name,
                        shouldGenerateFromTitle,
                    },
                },
            },
        },
    };

    return [slugField, checkBoxField];
};
