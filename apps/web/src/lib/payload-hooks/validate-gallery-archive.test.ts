import { describe, expect, it } from 'vitest';
import { getGalleryArchiveValidationErrors } from './validate-gallery-archive';

const publicGroup = {
    id: 'festivals',
    hasArchivePage: true,
    title: { da: 'Festivals' },
    slug: { da: 'festivals' },
};

describe('gallery archive validation', () => {
    it('allows organizational groups without a public title or slug', () => {
        expect(
            getGalleryArchiveValidationErrors({
                collection: 'tag-groups',
                data: {},
                locale: 'da',
                tags: [],
                groups: [],
            }),
        ).toEqual([]);
    });

    it('requires a public title and slug when enabling an archive', () => {
        const errors = getGalleryArchiveValidationErrors({
            collection: 'tag-groups',
            data: { hasArchivePage: true },
            locale: 'da',
            tags: [],
            groups: [],
        });
        expect(errors.map((error) => error.path)).toContain('title');
        expect(errors.map((error) => error.path)).toContain('slug');
    });

    it('permits the default-locale title and slug to serve untranslated locales', () => {
        expect(
            getGalleryArchiveValidationErrors({
                collection: 'tag-groups',
                data: { hasArchivePage: true, title: 'Festivals', slug: 'festivals' },
                locale: 'da',
                tags: [],
                groups: [],
            }),
        ).toEqual([]);
    });

    it('rejects a tag slug already owned by a public group', () => {
        const errors = getGalleryArchiveValidationErrors({
            collection: 'tags',
            data: { slug: 'festivals' },
            locale: 'da',
            tags: [],
            groups: [publicGroup],
        });
        expect(errors).toEqual([
            expect.objectContaining({ path: 'slug', message: expect.stringContaining('in da') }),
            expect.objectContaining({ path: 'slug', message: expect.stringContaining('in en') }),
        ]);
    });

    it('rejects enabling a group whose slug already belongs to a tag', () => {
        const errors = getGalleryArchiveValidationErrors({
            collection: 'tag-groups',
            originalId: publicGroup.id,
            data: { hasArchivePage: true },
            locale: 'da',
            tags: [{ id: 'legacy-festivals', slug: { da: 'festivals' } }],
            groups: [{ ...publicGroup, hasArchivePage: false }],
        });
        expect(errors.some((error) => error.path === 'slug')).toBe(true);
    });

    it.each(['tags', 'tag-groups'] as const)('rejects duplicate slugs within %s', (collection) => {
        const errors = getGalleryArchiveValidationErrors({
            collection,
            data: { hasArchivePage: true, title: 'Festivals', slug: 'festivals' },
            locale: 'da',
            tags: collection === 'tags' ? [{ id: 'other-tag', slug: { da: 'festivals' } }] : [],
            groups: collection === 'tag-groups' ? [publicGroup] : [],
        });
        expect(errors.some((error) => error.path === 'slug')).toBe(true);
    });

    it('ignores the current document and inactive group slugs', () => {
        expect(
            getGalleryArchiveValidationErrors({
                collection: 'tag-groups',
                originalId: publicGroup.id,
                data: { title: 'Updated festival heading' },
                locale: 'da',
                tags: [],
                groups: [publicGroup, { ...publicGroup, id: 'inactive', hasArchivePage: false }],
            }),
        ).toEqual([]);
    });

    it('checks untranslated English URLs when changing a Danish slug', () => {
        const errors = getGalleryArchiveValidationErrors({
            collection: 'tag-groups',
            originalId: publicGroup.id,
            data: { slug: 'live-shows' },
            locale: 'da',
            tags: [{ id: 'other-tag', slug: { da: 'other', en: 'live-shows' } }],
            groups: [publicGroup],
        });
        expect(errors).toEqual([expect.objectContaining({ path: 'slug', message: expect.stringContaining('in en') })]);
    });

    it('allows the same text in distinct locale URLs when no fallback collides', () => {
        expect(
            getGalleryArchiveValidationErrors({
                collection: 'tag-groups',
                originalId: publicGroup.id,
                data: { slug: 'shows' },
                locale: 'en',
                tags: [{ id: 'other-tag', slug: { da: 'shows', en: 'other' } }],
                groups: [publicGroup],
            }),
        ).toEqual([]);
    });

    it('allows a legacy tag without a slug or group to remain unchanged', () => {
        expect(
            getGalleryArchiveValidationErrors({
                collection: 'tags',
                originalId: 'legacy-tag',
                data: {},
                locale: 'da',
                tags: [{ id: 'legacy-tag' }],
                groups: [publicGroup],
            }),
        ).toEqual([]);
    });
});
