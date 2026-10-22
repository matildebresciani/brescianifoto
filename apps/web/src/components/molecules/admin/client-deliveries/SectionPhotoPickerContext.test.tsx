import type { FormState } from 'payload';
import React, { createElement, useContext } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SectionPhotoPickerContext, SectionPhotoPickerProvider } from './SectionPhotoPickerContext';

const mocks = vi.hoisted(() => {
    const fields: FormState = {};
    return { fields };
});
vi.mock('@payloadcms/ui', () => ({
    useDocumentInfo: () => ({ id: 'gallery-1' }),
    useFormFields: (selector: (state: [FormState]) => unknown) => selector([mocks.fields]),
}));

function Selection() {
    return createElement('output', null, JSON.stringify(useContext(SectionPhotoPickerContext)));
}
const render = () =>
    renderToStaticMarkup(
        <SectionPhotoPickerProvider>
            <Selection />
        </SectionPhotoPickerProvider>,
    );

beforeEach(() => vi.stubGlobal('React', React));
afterEach(() => vi.unstubAllGlobals());

describe('section photo picker exclusions', () => {
    it('hides photos from every current section while keeping a cover-only photo available', () => {
        mocks.fields = {
            cover: { value: 'featured' },
            'blocks.0.blockType': { value: 'photos' },
            'blocks.0.photos': { value: ['first', { id: 'second' }] },
            'blocks.1.blockType': { value: 'text' },
            'blocks.1.photos': { value: ['not-a-photo-section'] },
            'blocks.2.blockType': { value: 'photos' },
            'blocks.2.photos': { value: ['third', 'first'] },
        };
        const html = render();
        expect(html).toContain('first');
        expect(html).toContain('second');
        expect(html).toContain('third');
        expect(html).not.toContain('featured');
        expect(html).not.toContain('not-a-photo-section');
    });
    it('updates from unsaved selections and removals without using saved document data', () => {
        mocks.fields = { 'blocks.0.blockType': { value: 'photos' }, 'blocks.0.photos': { value: ['unsaved'] } };
        expect(render()).toContain('unsaved');
        mocks.fields = { 'blocks.0.blockType': { value: 'photos' }, 'blocks.0.photos': { value: [] } };
        expect(render()).not.toContain('unsaved');
    });
});
