import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PhotoLibrary } from './PhotoLibrary';

const mocks = vi.hoisted(() => ({ usePayloadAPI: vi.fn(), useDocumentInfo: vi.fn() }));
vi.mock('@payloadcms/ui', () => ({
    Button: ({ children, buttonStyle, ...props }: { children: React.ReactNode; buttonStyle?: string }) =>
        createElement('button', { type: 'button', ...props }, children),
    useConfig: () => ({ config: { serverURL: '', routes: { api: '/api' } } }),
    useDocumentInfo: mocks.useDocumentInfo,
    usePayloadAPI: mocks.usePayloadAPI,
}));
vi.mock('./UploadPanel', () => ({
    UploadPanel: ({ isDisabled }: { isDisabled: boolean }) =>
        createElement('button', { type: 'button', disabled: isDisabled }, 'Upload photos'),
}));

const photo = {
    id: 'photo-1',
    gallery: 'gallery-1',
    originalFilename: 'Live.jpg',
    url: 'https://example.test/original.jpg',
    thumbnailURL: 'https://example.test/thumbnail.webp',
};
const result = { docs: [photo], totalDocs: 25, totalPages: 2, hasNextPage: true, hasPrevPage: false };
const render = (isReadOnly = false) =>
    renderToStaticMarkup(
        createElement(PhotoLibrary, {
            field: { name: 'photoLibrary', type: 'ui', admin: {} },
            path: 'photoLibrary',
            readOnly: isReadOnly,
        }),
    );

beforeEach(() => {
    vi.stubGlobal('React', React);
    mocks.useDocumentInfo.mockReturnValue({ id: 'gallery-1' });
    mocks.usePayloadAPI.mockReturnValue([{ data: result, isLoading: false, isError: false }, {}]);
});

afterEach(() => vi.unstubAllGlobals());

describe('inline client photo library', () => {
    it('loads a gallery-filtered page immediately and links thumbnails to their originals', () => {
        const html = render();
        expect(mocks.usePayloadAPI).toHaveBeenCalledWith('/api/client-photos', {
            initialParams: {
                where: { gallery: { equals: 'gallery-1' } },
                depth: 0,
                limit: 24,
                page: 1,
                sort: '-createdAt,-id',
            },
        });
        expect(html).toContain('src="https://example.test/thumbnail.webp"');
        expect(html).toContain('href="https://example.test/original.jpg"');
        expect(html).toContain('Live.jpg');
        expect(html).toContain('Page 1 of 2');
        expect(html).not.toContain('Browse all photos');
    });
    it('keeps uploaded photographs browsable when uploads are read-only', () => {
        const html = render(true);
        expect(html).toContain('<button type="button" disabled="">Upload photos</button>');
        expect(html).toContain('href="https://example.test/original.jpg"');
    });
    it('requires a saved gallery before making library requests', () => {
        mocks.useDocumentInfo.mockReturnValue({});
        expect(render()).toContain('Save a draft to enable uploads.');
        expect(mocks.usePayloadAPI).not.toHaveBeenCalled();
    });
    it('shows loading and empty states without requiring a drawer', () => {
        mocks.usePayloadAPI.mockReturnValue([{ data: {}, isLoading: true, isError: false }, {}]);
        expect(render()).toContain('Loading uploaded photos');
        mocks.usePayloadAPI.mockReturnValue([
            { data: { ...result, docs: [], totalDocs: 0, totalPages: 0 }, isLoading: false, isError: false },
            {},
        ]);
        expect(render()).toContain('No photos uploaded yet.');
    });
    it('offers retry for failed, malformed, and cross-gallery responses', () => {
        for (const data of [{}, { ...result, docs: [{ ...photo, gallery: 'another-gallery' }] }]) {
            mocks.usePayloadAPI.mockReturnValue([{ data, isLoading: false, isError: false }, {}]);
            const html = render();
            expect(html).toContain('Could not load uploaded photos.');
            expect(html).toContain('Retry');
            expect(html).not.toContain('Live.jpg');
        }
        mocks.usePayloadAPI.mockReturnValue([{ data: result, isLoading: false, isError: true }, {}]);
        expect(render()).toContain('Could not load uploaded photos.');
    });
});
