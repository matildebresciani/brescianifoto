import type { Endpoint } from 'payload';
import { locales } from '@/i18n/localized-collections';
import { isFestivalGallery } from '@/lib/utilities/festival-gallery';
import { type FestivalMigrationSnapshot, planFestivalURLMigration } from '@/lib/utilities/festival-url-migration';
import { getServerSideURL } from '@/lib/utilities/get-url';
import { canRunFestivalMaintenance } from '@/lib/utilities/maintenance-auth';
import type { Redirect } from '@/payload-types';

/** Runs inside Next so ordinary Payload hooks also invalidate public gallery and redirect caches. */
export const festivalURLMaintenance: Endpoint = {
    path: '/maintenance/festival-urls',
    method: 'post',
    handler: async (req) => {
        const mode = new URL(req.url ?? '', getServerSideURL()).searchParams.get('mode') ?? 'dry-run';
        if (mode !== 'dry-run' && mode !== 'apply') return Response.json({ error: 'Unknown mode.' }, { status: 400 });
        if (!canRunFestivalMaintenance(req.payload.config.secret, mode, req.headers)) {
            return Response.json({ error: 'Unauthorized.' }, { status: 401 });
        }
        const snapshots: FestivalMigrationSnapshot[] = await Promise.all(
            locales.map(async (locale) => {
                const result = await req.payload.find({
                    collection: 'galleries',
                    locale,
                    fallbackLocale: false,
                    depth: 2,
                    limit: 0,
                    pagination: false,
                    overrideAccess: true,
                });
                return { locale, galleries: result.docs };
            }),
        );
        const redirects = await req.payload.find({
            collection: 'redirects',
            limit: 0,
            pagination: false,
            overrideAccess: true,
        });
        const serverURL = getServerSideURL();
        const plan = planFestivalURLMigration(snapshots, redirects.docs, serverURL);
        const galleries = snapshots[0]?.galleries ?? [];
        const summary = {
            inspectedGalleries: galleries.length,
            festivalGalleries: galleries.filter(isFestivalGallery).length,
        };
        if (plan.errors.length || mode === 'dry-run') {
            return Response.json(
                { mode, applied: false, ...summary, ...plan },
                { status: plan.errors.length ? 409 : 200 },
            );
        }

        // Save redirects first: gallery pages resolve existing content before consulting old-URL redirects.
        for (const redirect of plan.redirects) {
            const data = {
                redirectFrom: redirect.from,
                redirectTo: new URL(redirect.to, serverURL).toString(),
                redirectType: '308',
                active: true,
            } satisfies Pick<Redirect, 'redirectFrom' | 'redirectTo' | 'redirectType' | 'active'>;
            if (redirect.existingId) {
                await req.payload.update({
                    collection: 'redirects',
                    id: redirect.existingId,
                    data,
                    overrideAccess: true,
                    req: { ...req },
                });
            } else {
                await req.payload.create({ collection: 'redirects', data, overrideAccess: true, req: { ...req } });
            }
        }
        for (const change of plan.changes) {
            await req.payload.update({
                collection: 'galleries',
                id: change.id,
                locale: change.locale,
                data: {
                    slug: change.slug,
                    slugLock: false,
                    ...(change.recoveredYear ? { datePrecision: 'year', year: change.recoveredYear } : {}),
                },
                overrideAccess: true,
                req: { ...req, locale: change.locale },
            });
        }
        return Response.json({ mode, applied: true, ...summary, ...plan });
    },
};
