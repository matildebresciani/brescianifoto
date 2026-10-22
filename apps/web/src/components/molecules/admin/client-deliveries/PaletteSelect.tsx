'use client';

import { FieldDescription, FieldError, FieldLabel, ReactSelect, useField } from '@payloadcms/ui';
import { mergeFieldStyles } from '@payloadcms/ui/shared';
import type { TextFieldClientProps } from 'payload';
import { type HTMLAttributes, type Ref, useId } from 'react';
import {
    galleryPalette,
    libraryPalette,
    type PaletteOption,
    paletteToken,
    resolveSectionTheme,
    resolveThemeColors,
} from '@/lib/client-deliveries/theme';
import { ColorValue } from './ColorValue';
import { useGalleryTheme, useSectionColors } from './theme-form';

type OptionProps = {
    data: PaletteOption;
    innerProps?: HTMLAttributes<HTMLDivElement>;
    innerRef?: Ref<HTMLDivElement>;
    isFocused?: boolean;
    isSelected?: boolean;
    isDisabled?: boolean;
};

// Preserve ReactSelect's roles, event handlers and refs for keyboard and pointer navigation.
function SwatchOption({ data, innerProps, innerRef, isFocused, isSelected, isDisabled }: OptionProps) {
    return (
        <div
            {...innerProps}
            ref={innerRef}
            className={[
                'rs__option',
                isFocused && 'rs__option--is-focused',
                isSelected && 'rs__option--is-selected',
                isDisabled && 'rs__option--is-disabled',
            ]
                .filter(Boolean)
                .join(' ')}
        >
            <ColorValue label={data.label} hex={data.color} />
        </div>
    );
}
function SwatchValue({ data, innerProps }: OptionProps) {
    return (
        <div
            {...innerProps}
            className="rs__single-value react-select--single-value"
            style={{ gridArea: '1 / 1 / 2 / 3' }}
        >
            <ColorValue label={data.label} hex={data.color} />
        </div>
    );
}
const components = { Option: SwatchOption, SingleValue: SwatchValue };

/** A text-backed selector allows per-gallery tokens while keeping existing stored references readable. */
export function PaletteSelect({ field, path: suppliedPath, readOnly }: TextFieldClientProps) {
    const inputId = `gallery-color-${useId()}`;
    const { value, setValue, path, showError, disabled } = useField<string | null>({
        potentiallyStalePath: suppliedPath,
    });
    const { theme } = useGalleryTheme();
    const prefix = path.slice(0, path.lastIndexOf('.'));
    const colors = useSectionColors(prefix);
    const isText = field.name === 'textSource';
    const isToken = path.startsWith('theme.');
    const resolved = resolveThemeColors(theme);
    const inherited = isText ? resolved.text : resolved.background;
    const source = value || (isText ? colors.textSource : colors.backgroundSource);
    const legacy = colors[isText ? 'text' : 'background'];
    const follow = field.name === 'bgInvert' ? resolved.text : resolved.background;
    const canFollow = field.name === 'bgInvert' || field.name === 'fgOnColor';
    const options: PaletteOption[] = isToken
        ? [
              ...(canFollow
                  ? [
                        {
                            value: '',
                            label: field.name === 'bgInvert' ? 'Follow fg-base' : 'Follow bg-base',
                            color: follow,
                        },
                    ]
                  : []),
              ...libraryPalette(theme),
          ]
        : [
              { value: 'inherit', label: 'Gallery default', color: inherited },
              ...(isText && source === 'automatic'
                  ? [
                        {
                            value: 'automatic',
                            label: 'Automatic',
                            color: resolveSectionTheme(theme, { ...colors, textSource: 'automatic' }).theme.text,
                        },
                    ]
                  : []),
              ...galleryPalette(theme).filter(
                  (option) => !/^(bg|fg)-highlight-/.test(option.value) || option.value === source,
              ),
              { value: 'custom', label: 'Custom color', color: typeof legacy === 'string' ? legacy : undefined },
          ];
    const selected =
        typeof source === 'string' ? options.find((option) => option.value === paletteToken(source)) : undefined;
    const current: PaletteOption =
        selected ??
        (isToken
            ? (options.find((option) => option.color?.toLowerCase() === value?.toLowerCase()) ??
              (value
                  ? {
                        value,
                        label: value.startsWith('color-') ? 'Missing palette color' : 'Existing color',
                        color: value.startsWith('#') ? value : undefined,
                    }
                  : {
                        value: '',
                        label: canFollow
                            ? field.name === 'bgInvert'
                                ? 'Follow fg-base'
                                : 'Follow bg-base'
                            : 'Choose a palette color',
                        color: canFollow ? follow : undefined,
                    }))
            : source
              ? { value: String(source), label: 'Missing color' }
              : {
                    value: '',
                    label: legacy ? 'Existing custom color' : 'Gallery default',
                    color: typeof legacy === 'string' && legacy ? legacy : inherited,
                });
    const isReadOnly = readOnly || field.admin?.readOnly || disabled;
    return (
        <div
            id={`field-${path.replace(/\./g, '__')}`}
            style={mergeFieldStyles(field)}
            className={[
                'field-type',
                'select',
                'delivery-palette-select',
                showError && 'error',
                isReadOnly && 'read-only',
            ]
                .filter(Boolean)
                .join(' ')}
        >
            <FieldLabel htmlFor={inputId} label={field.label} path={path} required={field.required} />
            <div className="field-type__wrap">
                <FieldError path={path} showError={showError} />
                <ReactSelect
                    inputId={inputId}
                    components={components}
                    options={options}
                    value={current}
                    disabled={isReadOnly}
                    showError={showError}
                    isClearable={false}
                    onChange={(option) => {
                        if (!isReadOnly && option && !Array.isArray(option) && typeof option.value === 'string')
                            setValue(option.value);
                    }}
                />
            </div>
            <FieldDescription path={path} description={field.admin?.description} />
        </div>
    );
}
