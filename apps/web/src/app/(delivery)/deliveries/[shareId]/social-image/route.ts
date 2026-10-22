import { ResultAsync } from 'neverthrow';
import { readDelivery } from '@/lib/client-deliveries/read';
import { featuredPhoto, renderSocialImage } from '@/lib/client-deliveries/social';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const headers = {
    'Cache-Control': 'private, no-store',
    'X-Robots-Tag': 'noindex, nofollow, noimageindex',
    'Referrer-Policy': 'no-referrer',
};

export async function GET(request: Request, { params }: { params: Promise<{ shareId: string }> }) {
    if (new URL(request.url).searchParams.has('preview')) return new Response('Not found', { status: 404, headers });
    const { shareId } = await params;
    const result = await ResultAsync.fromPromise(
        (async () => {
            const data = await readDelivery(shareId);
            if (!data) return new Response('Not found', { status: 404, headers });
            const photo = featuredPhoto(data);
            if (!photo) return new Response('Not found', { status: 404, headers });
            const bytes = await renderSocialImage(photo, data.gallery.focalX ?? 50, data.gallery.focalY ?? 50);
            if (!bytes) return new Response('Image temporarily unavailable', { status: 503, headers });
            return new Response(new Uint8Array(bytes), { headers: { ...headers, 'Content-Type': 'image/jpeg' } });
        })(),
        () => 'Image temporarily unavailable',
    );
    return result.isOk() ? result.value : new Response(result.error, { status: 503, headers });
}
