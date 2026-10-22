import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import RichText from './index';

const text = (value: string, format = 0, style = ''): SerializedTextNode => ({
    type: 'text',
    text: value,
    format,
    style,
    detail: 0,
    mode: 'normal',
    version: 1,
});

const block = (type: string, children: SerializedTextNode[]): SerializedElementNode => ({
    type,
    children,
    direction: null,
    format: '',
    indent: 0,
    version: 1,
});

describe('frontend rich-text typography', () => {
    it('renders gallery metadata marks and authored headings without changing saved text or sizes', () => {
        const data = {
            root: {
                ...block('root', []),
                children: [
                    { ...block('heading', [text('Keep MiXeD case')]), tag: 'h2' },
                    block('paragraph', [
                        { ...text('Venue · Mixed Case', 3, 'font-size:48px;'), $: { deliveryStyle: 'metadata' } },
                    ]),
                ],
            },
        };
        const original = JSON.stringify(data);
        const html = renderToStaticMarkup(createElement(RichText, { data, isDelivery: true, enableGutter: false }));
        expect(html).toContain('delivery-rich-text');
        expect(html).toContain('<h2>Keep MiXeD case</h2>');
        expect(html).toContain(
            '<span data-delivery-style="metadata"><em><strong>Venue · Mixed Case</strong></em></span>',
        );
        expect(html).not.toContain('font-size');
        expect(JSON.stringify(data)).toBe(original);
        const portfolio = renderToStaticMarkup(createElement(RichText, { data, enableGutter: false }));
        expect(portfolio).not.toContain('delivery-rich-text');
        expect(portfolio).not.toContain('data-delivery-style');
    });
    it('ignores legacy inline sizing without changing case, headings, emphasis, or saved content', () => {
        const data = {
            root: {
                ...block('root', []),
                children: [
                    { ...block('heading', [text('A mixed-case heading', 0, 'font-size:3rem;')]), tag: 'h2' },
                    block('paragraph', [text('Keep MiXeD case', 3, 'FONT-SIZE: 48px; color: red;')]),
                ],
            },
        };
        const original = JSON.stringify(data);
        const html = renderToStaticMarkup(createElement(RichText, { data, enableGutter: false }));

        expect(html).toContain('body-md wysiwyg');
        expect(html).toContain('<h2>A mixed-case heading</h2>');
        expect(html).toContain('<em><strong>Keep MiXeD case</strong></em>');
        expect(html).not.toMatch(/font-size|48px|3rem/);
        expect(JSON.stringify(data)).toBe(original);
    });

    it('retains links, lists, italics, and the compact caption role', () => {
        const link = {
            ...block('link', [text('Read the story', 2)]),
            fields: { linkType: 'custom', url: 'https://example.com/story', newTab: true },
        };
        const list = {
            ...block('list', []),
            tag: 'ul',
            listType: 'bullet',
            start: 1,
            children: [{ ...block('listitem', [text('A real moment')]), value: 1 }],
        };
        const data = {
            root: { ...block('root', []), children: [{ ...block('paragraph', []), children: [link] }, list] },
        };
        const html = renderToStaticMarkup(createElement(RichText, { data, enableGutter: false, className: 'body-sm' }));

        expect(html).toContain('body-sm');
        expect(html).not.toContain('prose');
        expect(html).toContain('href="https://example.com/story"');
        expect(html).toContain('target="_blank"');
        expect(html).toContain('rel="noopener noreferrer"');
        expect(html).toContain('<em>Read the story</em>');
        expect(html).toMatch(/<ul\b/);
        expect(html).toContain('A real moment');
    });

    it('keeps rendering when an existing internal link has an unpopulated document reference', () => {
        const link = {
            ...block('link', [text('Internal story')]),
            fields: { linkType: 'internal', doc: { relationTo: 'pages', value: 'unpopulated-id' }, newTab: false },
        };
        const data = { root: { ...block('root', []), children: [{ ...block('paragraph', []), children: [link] }] } };
        const html = renderToStaticMarkup(createElement(RichText, { data, enableGutter: false }));

        expect(html).toContain('<a href="#">Internal story</a>');
    });
});

import type { SerializedElementNode, SerializedTextNode } from 'lexical';
