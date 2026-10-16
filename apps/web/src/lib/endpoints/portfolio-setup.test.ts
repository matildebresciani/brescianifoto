import { mongooseAdapter } from '@payloadcms/db-mongodb';
import payload, { buildConfig, createLocalReq } from 'payload';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { imageMock } from '@/__mocks__/storybook-mocks';
import { signPortfolioSetup } from '@/lib/utilities/maintenance-auth';
import { portfolioPageContent } from '@/lib/utilities/portfolio-page-content';
import type { Navigation, Option, Page, TagGroup } from '@/payload-types';
import { portfolioSetup } from './portfolio-setup';

const mocks = vi.hoisted(() => ({ syncAutomaticGalleryMix: vi.fn() }));
vi.mock('@/lib/payload-hooks/automatic-gallery-mix', () => mocks);
const secret = 'portfolio-setup-unit-test';
const home: Page = {
    id: 'home',
    name: 'Home',
    title: 'Home',
    slug: '/',
    publishStatus: 'public',
    createdAt: '',
    updatedAt: '',
    layout: [{ blockType: 'gallery', selectionMode: 'custom', gallery: ['second', 'first'] }],
};
const options: Option = {
    id: 'options',
    defaultPages: { homepage: 'home' },
    socialLinks: [{ link: { type: 'custom', label: 'instagram', url: 'https://www.instagram.com/brescianifoto/' } }],
};
const groups: TagGroup[] = ['concerts', 'festivals'].map((slug) => ({
    id: slug,
    name: slug,
    slug,
    title: slug === 'concerts' ? 'Concerts' : 'Festivals',
    hasArchivePage: true,
    createdAt: '',
    updatedAt: '',
}));
const menu: Navigation = {
    id: 'menu',
    title: 'Menu',
    navItems: [{ link: { type: 'custom', label: 'About', url: '/about' } }],
    createdAt: '',
    updatedAt: '',
};
const pages: Page[] = [
    home,
    ...(['About', 'Contact'] as const).map((title) => ({
        ...home,
        id: title.toLowerCase(),
        name: title,
        title,
        slug: title.toLowerCase(),
        layout: [{ blockType: 'paragraph' as const, richText: portfolioPageContent(title) }],
    })),
];

beforeAll(async () => {
    payload.config = await buildConfig({
        secret,
        db: mongooseAdapter({ url: 'mongodb://127.0.0.1:27017/portfolio-setup-unit-test' }),
        localization: { locales: ['da', 'en'], defaultLocale: 'da' },
        collections: [
            { slug: 'pages', fields: [] },
            { slug: 'galleries', fields: [] },
            { slug: 'media', fields: [] },
            { slug: 'tag-groups', fields: [] },
            { slug: 'navigation', fields: [] },
        ],
        globals: [{ slug: 'options', fields: [] }],
    });
    Object.assign(payload, { db: payload.config.db.init({ payload }) });
});
beforeEach(() => {
    vi.spyOn(payload.db, 'findGlobal').mockResolvedValue({
        id: 'options',
        socialLinks: { da: options.socialLinks, en: options.socialLinks },
    });
    vi.spyOn(payload.db, 'updateGlobal').mockResolvedValue({});
    vi.spyOn(payload, 'findGlobal').mockResolvedValue(options);
    vi.spyOn(payload, 'updateGlobal').mockResolvedValue(options);
    vi.spyOn(payload, 'create').mockResolvedValue(home);
    vi.spyOn(payload, 'update').mockResolvedValue(home);
    vi.spyOn(payload, 'find').mockImplementation(async ({ collection }) => {
        const docs =
            collection === 'pages'
                ? pages
                : collection === 'tag-groups'
                  ? groups
                  : collection === 'media'
                    ? [imageMock]
                    : collection === 'navigation'
                      ? [menu]
                      : [];
        return {
            docs,
            totalDocs: docs.length,
            totalPages: 1,
            limit: 0,
            page: 1,
            pagingCounter: 1,
            hasNextPage: false,
            hasPrevPage: false,
        };
    });
});
const request = async (mode: string, hasSignature = true) => {
    const timestamp = String(Date.now());
    const headers = new Headers(
        hasSignature
            ? {
                  'x-maintenance-timestamp': timestamp,
                  'x-maintenance-signature': signPortfolioSetup(secret, mode, timestamp),
              }
            : {},
    );
    return createLocalReq(
        { req: { url: `http://localhost:3001/api/maintenance/portfolio-setup?mode=${mode}`, headers } },
        payload,
    );
};

describe('portfolio setup endpoint', () => {
    it('rejects unauthorized requests and unknown modes without querying data', async () => {
        expect((await portfolioSetup.handler(await request('apply', false))).status).toBe(401);
        expect((await portfolioSetup.handler(await request('unknown'))).status).toBe(400);
        expect(payload.find).not.toHaveBeenCalled();
        expect(payload.db.findGlobal).not.toHaveBeenCalled();
    });
    it('keeps the dry run strictly read-only', async () => {
        const response = await portfolioSetup.handler(await request('dry-run'));
        expect(response.status).toBe(200);
        expect(await response.json()).toMatchObject({ applied: false });
        expect(payload.create).not.toHaveBeenCalled();
        expect(payload.update).not.toHaveBeenCalled();
        expect(payload.updateGlobal).not.toHaveBeenCalled();
        expect(payload.db.updateGlobal).not.toHaveBeenCalled();
        expect(mocks.syncAutomaticGalleryMix).not.toHaveBeenCalled();
    });
    it('preserves populated pages, custom photo order, and valid social settings on repeated setup', async () => {
        const response = await portfolioSetup.handler(await request('apply'));
        expect(response.status).toBe(200);
        expect(payload.create).not.toHaveBeenCalled();
        expect(payload.db.updateGlobal).not.toHaveBeenCalled();
        expect(payload.update).toHaveBeenCalledTimes(2);
        expect(payload.update).toHaveBeenCalledWith(
            expect.objectContaining({ id: 'home', data: { publishStatus: 'public', layout: home.layout } }),
        );
        expect(mocks.syncAutomaticGalleryMix).toHaveBeenCalledTimes(2);
    });
    it('creates About with the block CTA while keeping Contact links in rich text', async () => {
        vi.mocked(payload.find).mockImplementation(async ({ collection }) => {
            const docs =
                collection === 'pages'
                    ? [home]
                    : collection === 'tag-groups'
                      ? groups
                      : collection === 'media'
                        ? [imageMock]
                        : collection === 'navigation'
                          ? [menu]
                          : [];
            return {
                docs,
                totalDocs: docs.length,
                totalPages: 1,
                limit: 0,
                page: 1,
                pagingCounter: 1,
                hasNextPage: false,
                hasPrevPage: false,
            };
        });

        expect((await portfolioSetup.handler(await request('apply'))).status).toBe(200);
        for (const locale of ['da', 'en']) {
            expect(payload.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    collection: 'pages',
                    locale,
                    data: expect.objectContaining({
                        slug: 'about',
                        layout: [
                            expect.objectContaining({
                                blockType: 'text-image',
                                addLink: true,
                                link: {
                                    type: 'custom',
                                    label: 'Get in touch',
                                    url: '/contact',
                                    openNewTab: false,
                                },
                                richText: portfolioPageContent('About'),
                            }),
                        ],
                    }),
                }),
            );
            expect(payload.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    collection: 'pages',
                    locale,
                    data: expect.objectContaining({
                        slug: 'contact',
                        layout: [
                            expect.objectContaining({ addLink: false, richText: portfolioPageContent('Contact') }),
                        ],
                    }),
                }),
            );
        }
        expect(JSON.stringify(portfolioPageContent('About'))).not.toContain('Get in touch');
        expect(JSON.stringify(portfolioPageContent('Contact'))).toContain('mailto:matildepio@hotmail.dk');
    });
});
