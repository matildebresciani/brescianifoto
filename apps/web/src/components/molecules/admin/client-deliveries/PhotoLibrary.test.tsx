import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PhotoBrowser } from './PhotoBrowser';
import { PhotoLibrary } from './PhotoLibrary';

const mocks = vi.hoisted(() => ({ usePayloadAPI: vi.fn(), useDocumentInfo: vi.fn() }));
vi.mock('@payloadcms/ui', () => ({
    Button: ({ children, buttonStyle, ...props }: { children: React.ReactNode; buttonStyle?: string }) =>
        createElement('button', { type: 'button', ...props }, children),
    FieldLabel: ({ htmlFor, label }: { htmlFor: string; label: string }) => createElement('label', { htmlFor }, label),
    ReactSelect: ({
        inputId,
        options,
        value,
    }: {
        inputId: string;
        options: { label: string; value: string }[];
        value: { value: string };
    }) =>
        createElement(
            'select',
            { id: inputId, defaultValue: value.value },
            options.map((option) => createElement('option', { key: option.value, value: option.value }, option.label)),
        ),
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
    createdAt: '2026-10-22T10:00:00.000Z',
};
const photos = [
    photo,
    ...Array.from({ length: 24 }, (_, index) => ({
        ...photo,
        id: `photo-${index + 2}`,
        originalFilename: `Z-${index + 2}.jpg`,
    })),
];
const result = { docs: photos, totalDocs: 25, totalPages: 2, hasNextPage: true, hasPrevPage: false };
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
    mocks.usePayloadAPI.mockImplementation((_url, { initialParams }) => [
        {
            data: initialParams.select ? result : { docs: photos.slice(0, 24).reverse() },
            isLoading: false,
            isError: false,
        },
        {},
    ]);
});

afterEach(() => vi.unstubAllGlobals());

describe('inline client photo library', () => {
    it('offers page-limited bulk selection in the section picker and preserves its exclusion filter', () => {
        const where = { id: { not_in: ['already-selected'] } };
        const html = renderToStaticMarkup(
            createElement(PhotoBrowser, { galleryId: 'gallery-1', where, onChoose: vi.fn() }),
        );
        expect(html.match(/type="checkbox"/g)).toHaveLength(24);
        expect(html).toContain('Select all visible');
        expect(html).toContain('Add selected photos (0)');
        expect(mocks.usePayloadAPI).toHaveBeenCalledWith('/api/client-photos', {
            initialParams: {
                where: { and: [{ gallery: { equals: 'gallery-1' } }, where] },
                depth: 0,
                limit: 0,
                pagination: false,
                select: { gallery: true, originalFilename: true, createdAt: true },
            },
        });
    });
    it('sorts the complete filename index and loads originals only for the visible gallery-filtered page', () => {
        const html = render();
        expect(mocks.usePayloadAPI).toHaveBeenCalledWith('/api/client-photos', {
            initialParams: {
                where: { gallery: { equals: 'gallery-1' } },
                depth: 0,
                limit: 0,
                pagination: false,
                select: { gallery: true, originalFilename: true, createdAt: true },
            },
        });
        expect(mocks.usePayloadAPI).toHaveBeenCalledWith('/api/client-photos', {
            initialParams: {
                where: {
                    and: [
                        { gallery: { equals: 'gallery-1' } },
                        { id: { in: photos.slice(0, 24).map((item) => item.id) } },
                    ],
                },
                depth: 0,
                limit: 24,
            },
        });
        expect(html).toContain('src="https://example.test/thumbnail.webp"');
        expect(html).toContain('href="https://example.test/original.jpg"');
        expect(html).toContain('Live.jpg');
        expect(html).toContain('Page 1 of 2');
        expect(html).toContain('value="name" selected=""');
        expect(html.indexOf('Open original: Live.jpg')).toBeLessThan(html.indexOf('Open original: Z-2.jpg'));
        expect(html.indexOf('Open original: Z-2.jpg')).toBeLessThan(html.indexOf('Open original: Z-10.jpg'));
        expect(html).not.toContain('Open original: Z-25.jpg');
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
