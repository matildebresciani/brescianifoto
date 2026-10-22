import { describe, expect, it } from 'vitest';
import { formatPageTitle, withPageTitle } from './metadata-title';

const settings = { metaTitleSuffix: ' | brescianifoto' };

describe('CMS metadata title affixes', () => {
    it.each([
        ['Contact', 'Contact | brescianifoto'],
        ['Andrea & Emil', 'Andrea & Emil | brescianifoto'],
        ['brescianifoto — Concert photography', 'Concert photography | brescianifoto'],
        ['Artist — brescianifoto', 'Artist | brescianifoto'],
        ['brescianifoto | Artist · brescianifoto', 'Artist | brescianifoto'],
        ['BRESCIANIFOTO | Editorial title', 'Editorial title | brescianifoto'],
        ['  Posts | backstage  ', 'Posts | backstage | brescianifoto'],
        ['brescianifoto', 'brescianifoto'],
        ['', 'brescianifoto'],
    ])('formats %j consistently', (value, expected) => {
        expect(formatPageTitle(value, settings)).toBe(expected);
        expect(formatPageTitle(expected, settings)).toBe(expected);
    });

    it.each([
        [undefined, 'Contact'],
        [null, 'Contact'],
        [{ metaTitlePrefix: '', metaTitleSuffix: '' }, 'Contact'],
        [{ metaTitlePrefix: 'Studio | ' }, 'Studio | Contact'],
        [{ metaTitleSuffix: ' — Studio' }, 'Contact — Studio'],
        [{ metaTitlePrefix: 'Photo: ', metaTitleSuffix: ' | Studio' }, 'Photo: Contact | Studio'],
        [{ metaTitleSuffix: ' | Studio (live)+' }, 'Contact | Studio (live)+'],
    ])('uses the configured affixes %j without a hardcoded brand', (configuration, expected) => {
        expect(formatPageTitle('Contact', configuration)).toBe(expected);
        expect(formatPageTitle(expected, configuration)).toBe(expected);
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
                settings,
            ),
        ).toMatchObject({
            title: 'Contact | brescianifoto',
            description: 'Copy',
            openGraph: { title: 'Contact | brescianifoto', images: ['/cover.jpg'] },
            twitter: { title: 'Contact | brescianifoto', card: 'summary_large_image' },
        });
    });

    it('preserves inherited images and explicitly disabled social previews', () => {
        expect(withPageTitle({}, 'Contact', settings)).toEqual({ title: 'Contact | brescianifoto' });
        expect(withPageTitle({ openGraph: null, twitter: null }, 'Forhåndsvisning', settings)).toEqual({
            title: 'Forhåndsvisning | brescianifoto',
            openGraph: null,
            twitter: null,
        });
    });
});
