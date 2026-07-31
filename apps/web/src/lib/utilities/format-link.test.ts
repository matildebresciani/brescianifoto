import { describe, expect, it } from 'vitest';
import { formatLink } from './format-link';

const pageTemplate = {
    slug: '/',
    id: '123',
    name: 'About',
    title: 'About Page',
    publishStatus: 'public',
    createdAt: '',
    updatedAt: '',
} as const;

describe('formatLink', () => {
    it('should format custom url links correctly with different locales', () => {
        const customLink = {
            type: 'custom' as const,
            url: '/test-page',
        };

        expect(formatLink(customLink, 'da')).toBe('/test-page');
        expect(formatLink(customLink, 'en')).toBe('/en/test-page');
    });

    it('should return absolute urls without locale prefix', () => {
        const externalLink = {
            type: 'custom' as const,
            url: 'https://example.com',
        };

        expect(formatLink(externalLink, 'da')).toBe('https://example.com');
        expect(formatLink(externalLink, 'en')).toBe('https://example.com');
    });

    it('should format reference links correctly with different locales', () => {
        const referenceLink = {
            type: 'reference' as const,
            relation: {
                relationTo: 'pages' as const,
                value: { ...pageTemplate, slug: 'about' },
            },
        };

        expect(formatLink(referenceLink, 'da')).toBe('/about');
        expect(formatLink(referenceLink, 'en')).toBe('/en/about');
    });

    it('should handle home page slug correctly for different locales', () => {
        const homeLink = {
            type: 'reference' as const,
            relation: {
                relationTo: 'pages' as const,
                value: pageTemplate,
            },
        };

        expect(formatLink(homeLink, 'da')).toBe('/');
        expect(formatLink(homeLink, 'en')).toBe('/en');
    });

    it('should handle invalid relation data by returning locale path only', () => {
        const invalidLink = {
            type: 'reference' as const,
            relation: null,
        };

        expect(formatLink(invalidLink, 'da')).toBe('');
        expect(formatLink(invalidLink, 'en')).toBe('/en');
    });

    it('should handle `/` correctly with localized-collection', () => {
        const homeLink = {
            type: 'reference' as const,
            relation: {
                relationTo: 'posts' as const,
                value: pageTemplate,
            },
        };

        expect(formatLink(homeLink, 'da')).toBe('/artikel');
        expect(formatLink(homeLink, 'en')).toBe('/en/post');
    });

    it('should handle other slugs correctly with localized-collection', () => {
        const homeLink = {
            type: 'reference' as const,
            relation: {
                relationTo: 'posts' as const,
                value: { ...pageTemplate, slug: 'my-post' },
            },
        };

        expect(formatLink(homeLink, 'da')).toBe('/artikel/my-post');
        expect(formatLink(homeLink, 'en')).toBe('/en/post/my-post');
    });

    it('an empty slug should go to `/`', () => {
        const homeLink = {
            type: 'reference' as const,
            relation: {
                relationTo: 'pages' as const,
                value: pageTemplate,
            },
        };

        expect(formatLink(homeLink, 'da')).toBe('/');
        expect(formatLink(homeLink, 'en')).toBe('/en');
    });

    it('an empty slug should go to `/collection`', () => {
        const homeLink = {
            type: 'reference' as const,
            relation: {
                relationTo: 'posts' as const,
                value: pageTemplate,
            },
        };

        expect(formatLink(homeLink, 'da')).toBe('/artikel');
        expect(formatLink(homeLink, 'en')).toBe('/en/post');
    });
});
