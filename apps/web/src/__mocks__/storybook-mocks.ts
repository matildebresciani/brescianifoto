import type { Media } from '@/payload-types';

export const imageMock: Media = {
    id: '123',
    alt: 'Placeholder Image',
    url: '/images/__mocks__/placeholder.jpg',
    filename: 'placeholder.jpg',
    mimeType: 'image/jpeg',
    filesize: 12345,
    width: 800,
    height: 600,
    createdAt: '2025-10-17T00:00:00.000Z',
    updatedAt: '2025-10-17T00:00:00.000Z',
};

export const richTextMock = {
    root: {
        type: 'root',
        children: [
            {
                type: 'paragraph',
                version: 1,
                children: [
                    {
                        type: 'text',
                        version: 1,
                        text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
                    },
                ],
                direction: null,
                format: '',
                indent: 0,
            },
        ],
        direction: 'ltr' as const,
        format: '' as const,
        indent: 0,
        version: 1,
    },
};
