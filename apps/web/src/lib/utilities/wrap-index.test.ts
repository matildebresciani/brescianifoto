import { describe, expect, it } from 'vitest';
import { wrapIndex } from './wrap-index';

describe('wrapIndex', () => {
    it('steps forward and backward within range', () => {
        expect(wrapIndex(1, 1, 5)).toBe(2);
        expect(wrapIndex(1, -1, 5)).toBe(0);
    });

    it('wraps around both ends', () => {
        expect(wrapIndex(4, 1, 5)).toBe(0);
        expect(wrapIndex(0, -1, 5)).toBe(4);
    });
});
