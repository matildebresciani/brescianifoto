import { describe, expect, it } from 'vitest';
import { formatPageTitle, withPageTitle } from './metadata-title';

describe('shared metadata title prefix', () => {
    it.each([
        ['Contact', 'brescianifoto | Contact'],
        ['Andrea & Emil', 'brescianifoto | Andrea & Emil'],
        ['brescianifoto — Concert photography', 'brescianifoto | Concert photography'],
        ['Artist — brescianifoto', 'brescianifoto | Artist'],
        ['brescianifoto | Artist · brescianifoto', 'brescianifoto | Artist'],
        ['BRESCIANIFOTO | Editorial title', 'brescianifoto | Editorial title'],
        ['  Posts | backstage  ', 'brescianifoto | Posts | backstage'],
        ['brescianifoto', 'brescianifoto'],
        ['', 'brescianifoto'],
    ])('formats %j consistently', (value, expected) => {
        expect(formatPageTitle(value)).toBe(expected);
        expect(formatPageTitle(expected)).toBe(expected);
    });

    it('keeps browser and explicit social titles aligned while preserving images and descriptions', () => {
        expect(
            withPageTitle(
                {
                    description: 'Copy',
                    openGraph: { images: ['/cover.jpg'] },
                    twitter: { card: 'summary_large_image' },
                },
                'Contact',
            ),
        ).toMatchObject({
            title: 'brescianifoto | Contact',
            description: 'Copy',
            openGraph: { title: 'brescianifoto | Contact', images: ['/cover.jpg'] },
            twitter: { title: 'brescianifoto | Contact', card: 'summary_large_image' },
        });
    });

    it('preserves inherited images and explicitly disabled social previews', () => {
        expect(withPageTitle({}, 'Contact')).toEqual({ title: 'brescianifoto | Contact' });
        expect(withPageTitle({ openGraph: null, twitter: null }, 'Forhåndsvisning')).toEqual({
            title: 'brescianifoto | Forhåndsvisning',
            openGraph: null,
            twitter: null,
        });
    });
});
