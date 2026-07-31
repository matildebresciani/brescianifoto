import type { RequestCookie } from 'next/dist/compiled/@edge-runtime/cookies';
import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';
import type { PayloadRequest } from 'payload';
import z from 'zod';
import { isLocale, routedCollections } from '@/i18n/localized-collections';
import { initPayload } from '@/lib/config';

const CollectionSlugSchema = z.enum(routedCollections);

export async function GET(
    req: Request & {
        cookies: {
            get: (name: string) => RequestCookie | undefined;
        };
    },
): Promise<Response> {
    const payload = await initPayload();
    const { searchParams } = new URL(req.url ?? '');
    const path = searchParams.get('path');
    const collection = searchParams.get('collection');
    const slug = searchParams.get('slug');
    const locale = searchParams.get('locale');
    const validatedLocale = locale && isLocale(locale) ? locale : undefined;

    const previewSecret = searchParams.get('previewSecret');

    if (previewSecret) {
        return new Response('You are not allowed to preview this page', { status: 403 });
    }

    if (!path) {
        return new Response('No path provided', { status: 404 });
    }

    const parsedCollection = CollectionSlugSchema.safeParse(collection);
    if (!parsedCollection.success) {
        return new Response('Invalid collection', { status: 404 });
    }

    if (!slug) {
        return new Response('No slug provided', { status: 404 });
    }

    if (!path.startsWith('/')) {
        return new Response('This endpoint can only be used for internal previews', { status: 500 });
    }

    let user: unknown;

    try {
        user = await payload.auth({
            // biome-ignore lint: intended as
            req: req as unknown as PayloadRequest,
            headers: req.headers,
        });
    } catch (error) {
        payload.logger.error({ err: error }, 'Error verifying token for live preview');
        return new Response('You are not allowed to preview this page', { status: 403 });
    }

    const draft = await draftMode();

    // You can add additional checks here to see if the user is allowed to preview this page
    if (!user) {
        draft.disable();
        return new Response('You are not allowed to preview this page', { status: 403 });
    }

    // Verify the given slug exists
    try {
        const docs = await payload.find({
            collection: parsedCollection.data,
            draft: true,
            limit: 1,
            // pagination: false reduces overhead if you don't need totalDocs
            pagination: false,
            depth: 0,
            locale: validatedLocale,
            select: {},
            where: {
                slug: {
                    equals: slug,
                },
            },
        });

        if (!docs.docs.length) {
            return new Response('Document not found', { status: 404 });
        }
    } catch (error) {
        payload.logger.error({ err: error }, 'Error verifying token for live preview');
    }

    draft.enable();

    redirect(path);
}
