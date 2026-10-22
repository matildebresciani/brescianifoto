import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import RichText from '@/components/molecules/admin/RichText';
import { detailsFromText, normalizeDetails } from './details';

describe('legacy gallery Details', () => {
    it('preserves written case, blank lines, whitespace and literal HTML', () => {
        const converted = detailsFromText('First line\r\n\r\n  Keep MiXeD case\r<script>no HTML</script>\n');
        expect(converted.root.children).toHaveLength(5);
        const html = renderToStaticMarkup(createElement(RichText, { data: converted, enableGutter: false }));
        expect(html).toContain('First line');
        expect(html).toContain('  Keep MiXeD case');
        expect(html).toContain('&lt;script&gt;no HTML&lt;/script&gt;');
        expect(html).not.toContain('<script>');
    });
    it('is idempotent, preserves rich text and handles empty or absent values', () => {
        const rich = detailsFromText('Restored version');
        expect(normalizeDetails(rich)).toBe(rich);
        expect(normalizeDetails(normalizeDetails('Old draft'))).toEqual(detailsFromText('Old draft'));
        expect(normalizeDetails(null)).toBeNull();
        expect(normalizeDetails(undefined)).toBeUndefined();
        expect(normalizeDetails('')).toEqual(detailsFromText(''));
    });
});
