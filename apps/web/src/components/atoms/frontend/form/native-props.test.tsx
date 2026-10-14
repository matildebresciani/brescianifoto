import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BaseInput from './BaseInput';
import BaseTextarea from './BaseTextarea';

describe('native form props', () => {
    beforeEach(() => vi.stubGlobal('React', React));
    afterEach(() => vi.unstubAllGlobals());
    it('forwards controlled input props and keeps className on the wrapper', () => {
        const html = renderToStaticMarkup(
            React.createElement(BaseInput, {
                id: 'email',
                name: 'email',
                type: 'email',
                placeholder: 'Email address',
                value: 'hello@example.com',
                onChange: () => {},
                required: true,
                disabled: true,
                autoComplete: 'email',
                'aria-describedby': 'help',
                className: 'wrapper-only',
            }),
        );
        expect(html).toContain('<div class="relative wrapper-only">');
        expect(html).toContain('value="hello@example.com"');
        expect(html).toContain('required=""');
        expect(html).toContain('disabled=""');
        expect(html).toContain('autoComplete="email"');
        expect(html).toContain('aria-describedby="help"');
        expect(html).toContain('for="email"');
        expect(html.match(/wrapper-only/g)).toHaveLength(1);
    });
    it('forwards textarea contents, native dimensions and accessible labels', () => {
        const html = renderToStaticMarkup(
            React.createElement(BaseTextarea, {
                name: 'message',
                placeholder: 'Your message',
                defaultValue: 'A show in Copenhagen',
                rows: 6,
                maxLength: 1200,
                required: true,
                'aria-invalid': true,
            }),
        );
        expect(html).toContain('A show in Copenhagen</textarea>');
        expect(html).toContain('rows="6"');
        expect(html).toContain('maxLength="1200"');
        expect(html).toContain('aria-invalid="true"');
        const id = html.match(/\sid="([^"]+)"/)?.[1];
        expect(id).toBeTruthy();
        expect(html).toContain(`for="${id}"`);
    });
});
