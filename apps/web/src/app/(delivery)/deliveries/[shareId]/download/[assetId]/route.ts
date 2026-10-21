import { ResultAsync } from 'neverthrow';
import { readDelivery } from '@/lib/client-deliveries/read';
import { selectedPhotoIDs } from '@/lib/client-deliveries/shared';
import { originalDownloadURL } from '@/lib/client-deliveries/storage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request, { params }: { params: Promise<{ shareId: string; assetId: string }> }) {
    const { shareId, assetId } = await params;
    const isPreview = new URL(request.url).searchParams.get('preview') === '1';
    const data = await readDelivery(shareId, isPreview, request.headers);
    const headers = {
        'Cache-Control': 'private, no-store',
        'X-Robots-Tag': 'noindex, nofollow, noimageindex',
        'Referrer-Policy': 'no-referrer',
    };
    if (!data) return new Response('Not found', { status: 404, headers });
    const ids = selectedPhotoIDs(data.gallery.blocks);
    const photo =
        data.gallery.canDownloadPhotos && ids.includes(assetId)
            ? data.photos.find((item) => item.id === assetId)
            : undefined;
    const archive =
        data.gallery.canDownloadArchive && data.isArchiveCurrent && data.archive?.id === assetId
            ? data.archive
            : undefined;
    const file = photo || archive;
    if (!file) return new Response('Not found', { status: 404, headers });
    const url = await ResultAsync.fromPromise(
        originalDownloadURL(file.storageKey, file.originalFilename),
        () => 'Download temporarily unavailable. Please try again.',
    );
    if (url.isErr()) return new Response(url.error, { status: 503, headers });
    return new Response(null, { status: 302, headers: { ...headers, Location: url.value } });
}
