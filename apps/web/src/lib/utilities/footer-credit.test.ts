import { describe, expect, it } from 'vitest';
import { formatFooterCredit } from './footer-credit';

const now = new Date('2026-12-31T23:30:00Z');
describe('footer credit', () => {
    it('uses the current Copenhagen year for the default and legacy notices', () => {
        for (const template of [
            undefined,
            null,
            '',
            '© 2026 All rights reserved.',
            '© 2026 Alle rettigheder forbeholdes.',
        ]) {
            expect(formatFooterCredit(template, now)).toBe('© 2027 brescianifoto.');
        }
    });
    it('preserves custom copy and replaces every year placeholder', () => {
        expect(formatFooterCredit('Photographs © {year} Matilde · {year}', now)).toBe(
            'Photographs © 2027 Matilde · 2027',
        );
        expect(formatFooterCredit('Photographs by Matilde', now)).toBe('Photographs by Matilde');
    });
});
