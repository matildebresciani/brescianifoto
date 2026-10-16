import type { Endpoint, PayloadRequest } from 'payload';
import { locales } from '@/i18n/localized-collections';
import { syncAutomaticGalleryMix } from '@/lib/payload-hooks/automatic-gallery-mix';
import { isUsablePhoto } from '@/lib/utilities/automatic-gallery-mix';
import { getServerSideURL } from '@/lib/utilities/get-url';
import { canRunPortfolioSetup } from '@/lib/utilities/maintenance-auth';
import { portfolioPageContent } from '@/lib/utilities/portfolio-page-content';

/** Idempotent content setup runs inside Next so the normal hooks also invalidate public caches. */
export const portfolioSetup: Endpoint = {
    path: '/maintenance/portfolio-setup',
    method: 'post',
    handler: (req) =>
        setupPortfolio(req).catch((error: unknown) =>
            Response.json(
                { error: error instanceof Error ? error.message : 'Portfolio setup failed.' },
                { status: 500 },
            ),
        ),
};

async function setupPortfolio(req: PayloadRequest) {
    const mode = new URL(req.url ?? '', getServerSideURL()).searchParams.get('mode') ?? 'dry-run';
    if (mode !== 'dry-run' && mode !== 'apply') return Response.json({ error: 'Unknown mode.' }, { status: 400 });
    if (!canRunPortfolioSetup(req.payload.config.secret, mode, req.headers))
        return Response.json({ error: 'Unauthorized.' }, { status: 401 });
    const results: string[] = [];
    for (const locale of locales) {
        const localReq = { ...req, locale };
        const [options, galleries, pages, groups] = await Promise.all([
            req.payload.findGlobal({ slug: 'options', locale, depth: 0, req: localReq }),
            req.payload.find({
                collection: 'galleries',
                locale,
                depth: 1,
                pagination: false,
                where: { publishStatus: { equals: 'public' } },
                req: localReq,
            }),
            req.payload.find({ collection: 'pages', locale, depth: 1, pagination: false, req: localReq }),
            req.payload.find({ collection: 'tag-groups', locale, depth: 0, pagination: false, req: localReq }),
        ]);
        const photos = galleries.docs.flatMap((gallery) => gallery.gallery.filter(isUsablePhoto));
        const pagePhotos = pages.docs.flatMap(
            (page) =>
                page.layout?.flatMap((block) =>
                    block.blockType === 'gallery' ? (block.gallery ?? []).filter(isUsablePhoto) : [],
                ) ?? [],
        );
        const portfolioPhotos = photos.length ? photos : pagePhotos;
        const fallbackMedia = portfolioPhotos.length
            ? []
            : (
                  await req.payload.find({
                      collection: 'media',
                      locale,
                      limit: 2,
                      sort: '-createdAt',
                      where: { mimeType: { like: 'image/' } },
                      req: localReq,
                  })
              ).docs;
        const images = portfolioPhotos.length ? portfolioPhotos : fallbackMedia;

        if (mode === 'dry-run') {
            results.push(
                `${locale}: ${galleries.totalDocs} public galleries; ${images.length} available photos; About/Contact ${images.length ? 'ready' : 'need an uploaded image'}. Apply sets the contact links, initializes the saved mix, fills empty About/Contact pages and menus, and publishes a gallery-only homepage. Existing populated About/Contact pages and custom photo ordering are preserved.`,
            );
            continue;
        }

        const instagram = options.socialLinks?.find((item) => item.link?.url?.includes('instagram.com/brescianifoto'));
        const socialLinks = [
            ...(options.socialLinks ?? []).filter((item) => item !== instagram),
            {
                ...instagram,
                link: {
                    ...instagram?.link,
                    type: 'custom' as const,
                    label: 'instagram',
                    url: 'https://www.instagram.com/brescianifoto/',
                },
            },
        ];
        await req.payload.updateGlobal({
            slug: 'options',
            locale,
            req: localReq,
            data: {
                companyDetails: { ...options.companyDetails, email: 'matildepio@hotmail.dk' },
                socialLinks,
            },
        });
        await syncAutomaticGalleryMix(req.payload, locale, localReq);

        for (const title of ['About', 'Contact'] as const) {
            const slug = title.toLowerCase();
            const existing = pages.docs.find((page) => page.slug === slug);
            if (existing?.layout?.length) {
                results.push(`${locale}: kept existing ${title}.`);
                continue;
            }
            const image = images[title === 'About' ? 0 : 1] ?? images[0];
            if (!image) {
                results.push(`${locale}: ${title} needs an uploaded image before setup can create it.`);
                continue;
            }
            const data = {
                name: title,
                title,
                slug,
                publishStatus: 'public' as const,
                layout: [
                    {
                        blockType: 'text-image' as const,
                        order: 'image-left' as const,
                        image: image.id,
                        richText: portfolioPageContent(title),
                        addLink: false,
                    },
                ],
                meta: {
                    title: `${title} — brescianifoto`,
                    description:
                        title === 'About'
                            ? 'Concert and festival photography by brescianifoto.'
                            : 'Contact brescianifoto for concert photography, festival coverage and image requests.',
                    image: image.id,
                },
            };
            if (existing)
                await req.payload.update({ collection: 'pages', id: existing.id, locale, req: localReq, data });
            else await req.payload.create({ collection: 'pages', locale, req: localReq, data });
            results.push(`${locale}: prepared ${title} with editable temporary copy and an existing photograph.`);
        }
        for (const slug of ['concerts', 'festivals']) {
            if (!groups.docs.some((group) => group.slug === slug)) {
                await req.payload.create({
                    collection: 'tag-groups',
                    locale,
                    req: localReq,
                    data: {
                        name: slug === 'concerts' ? 'Concerts' : 'Festivals',
                        title: slug === 'concerts' ? 'Concerts' : 'Festivals',
                        slug,
                        slugLock: false,
                        hasArchivePage: true,
                    },
                });
            }
        }
        const menus = await req.payload.find({
            collection: 'navigation',
            locale,
            depth: 0,
            pagination: false,
            where: { or: [{ 'position.main': { equals: true } }, { 'position.mobile': { equals: true } }] },
            req: localReq,
        });
        const navItems = [
            { link: { type: 'custom' as const, label: 'Concerts', url: '/galleries/concerts' } },
            { link: { type: 'custom' as const, label: 'Festivals', url: '/galleries/festivals' } },
            { link: { type: 'custom' as const, label: 'About', url: '/about' } },
            { link: { type: 'custom' as const, label: 'Contact', url: '/contact' } },
        ];
        if (!menus.docs.length)
            await req.payload.create({
                collection: 'navigation',
                locale,
                req: localReq,
                data: { title: 'Main navigation', position: { main: true, mobile: true }, navItems },
            });
        for (const menu of menus.docs) {
            if (!menu.navItems?.length)
                await req.payload.update({
                    collection: 'navigation',
                    id: menu.id,
                    locale,
                    req: localReq,
                    data: { navItems },
                });
        }
        for (const group of groups.docs) {
            const title = group.slug === 'concerts' ? 'Concerts' : group.slug === 'festivals' ? 'Festivals' : null;
            if (title && group.title !== title)
                await req.payload.update({
                    collection: 'tag-groups',
                    id: group.id,
                    locale,
                    req: localReq,
                    data: { title, slugLock: false },
                });
        }
        const homepageId =
            typeof options.defaultPages?.homepage === 'string'
                ? options.defaultPages.homepage
                : options.defaultPages?.homepage?.id;
        const homepage = pages.docs.find((page) => page.id === homepageId);
        if (homepage) {
            const galleryBlocks = homepage.layout?.filter((block) => block.blockType === 'gallery') ?? [];
            await req.payload.update({
                collection: 'pages',
                id: homepage.id,
                locale,
                req: localReq,
                data: {
                    publishStatus: 'public',
                    layout: galleryBlocks.length ? galleryBlocks : [{ blockType: 'gallery', selectionMode: 'random' }],
                },
            });
        } else {
            const homepage = await req.payload.create({
                collection: 'pages',
                locale,
                req: localReq,
                data: {
                    name: 'Homepage',
                    title: 'brescianifoto',
                    slug: '/',
                    publishStatus: 'public',
                    layout: [{ blockType: 'gallery', selectionMode: 'random' }],
                },
            });
            await req.payload.updateGlobal({
                slug: 'options',
                locale,
                req: localReq,
                data: { defaultPages: { homepage: homepage.id } },
            });
        }
    }
    return Response.json({ mode, applied: mode === 'apply', results });
}
