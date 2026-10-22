'use client';

import { useField, useRowLabel } from '@payloadcms/ui';
import { useEffect } from 'react';
import { ColorValue } from './ColorValue';
import { useGalleryTheme } from './theme-form';

/** Show only the live hex while retaining stable internal references, even for collapsed rows. */
export function PaletteRowLabel() {
    const { data, path } = useRowLabel<{ id?: string; hex?: string }>();
    const { value, setValue, disabled } = useField<string>({ path: `${path}.key` });
    const { theme } = useGalleryTheme();
    const key = theme.colors?.find((entry) => entry.id === data.id)?.key;
    // Freeze the generated reference in Payload's form before a hex edit can change it.
    useEffect(() => {
        if (!disabled && key && value !== key) setValue(key);
    }, [disabled, key, value, setValue]);
    return <ColorValue label={data.hex?.toUpperCase() || 'Color'} hex={data.hex} />;
}
