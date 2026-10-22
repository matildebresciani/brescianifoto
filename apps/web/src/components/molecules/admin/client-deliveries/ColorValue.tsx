'use client';

import './admin.css';

/** Shared palette presentation for collapsed rows and selectable options. */
export function ColorValue({ label, hex }: { label: string; hex?: string }) {
    const hasValidHex = typeof hex === 'string' && /^#[0-9a-f]{6}$/i.test(hex);
    return (
        <span className="delivery-color-value">
            {hasValidHex && <span className="delivery-color-swatch" aria-hidden="true" style={{ background: hex }} />}
            <span>{label}</span>
            {hex && label.toUpperCase() !== hex.toUpperCase() && <span>{hex.toUpperCase()}</span>}
        </span>
    );
}
