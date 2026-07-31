import type { Paragraph } from '@/payload-types';

export const seededParagraphBlock = (): Paragraph => ({
    blockType: 'paragraph',
    richText: {
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
            direction: 'ltr',
            format: '',
            indent: 0,
            version: 1,
        },
    },
});
