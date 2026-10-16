import type { TextImage } from '@/payload-types';

const text = (value: string) => ({
    type: 'text',
    version: 1,
    text: value,
    format: 0,
    detail: 0,
    mode: 'normal',
    style: '',
});
const paragraph = (value: string) => ({
    type: 'paragraph',
    version: 1,
    children: [text(value)],
    direction: 'ltr',
    format: '',
    indent: 0,
});
const link = (label: string, url: string) => ({
    type: 'paragraph',
    version: 1,
    direction: 'ltr',
    format: '',
    indent: 0,
    children: [
        {
            type: 'link',
            version: 3,
            direction: 'ltr',
            format: '',
            indent: 0,
            fields: { linkType: 'custom', url, newTab: false },
            children: [text(label)],
        },
    ],
});

/** Temporary copy stays factual and editable; it makes no claims about location, clients or credentials. */
export function portfolioPageContent(page: 'About' | 'Contact'): NonNullable<TextImage['richText']> {
    return {
        root: {
            type: 'root',
            version: 1,
            direction: 'ltr',
            format: '',
            indent: 0,
            children: [
                {
                    type: 'heading',
                    tag: 'h1',
                    version: 1,
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    children: [text(page)],
                },
                ...(page === 'About'
                    ? [
                          paragraph('I photograph concerts and festivals, from the stage to the crowd.'),
                          paragraph(
                              'This portfolio brings together live music, artists and the people in the audience.',
                          ),
                      ]
                    : [
                          paragraph('For concert photography, festival coverage or image requests, send me an email.'),
                          paragraph(
                              'Include the artist or event, date, venue and how you would like to use the photographs.',
                          ),
                          link('email: matildepio@hotmail.dk', 'mailto:matildepio@hotmail.dk'),
                          link('instagram', 'https://www.instagram.com/brescianifoto/'),
                      ]),
            ],
        },
    };
}
