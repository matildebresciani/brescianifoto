import { createHash } from 'node:crypto';
import type { Metadata } from 'next';
import sharp from 'sharp';
import { getServerSideURL } from '@/lib/utilities/get-url';
import { readDelivery } from './read';
import { maxPhotoBytes, relationshipID } from './shared';
import { assetURL } from './storage';

export const socialImageSize = { width: 1200, height: 630 };

/** Resolve only the currently published gallery's own featured image. */
export function featuredPhoto(data: NonNullable<Awaited<ReturnType<typeof readDelivery>>>) {
    const id = relationshipID(data.gallery.cover);
    return data.photos.find((photo) => photo.id === id && relationshipID(photo.gallery) === data.gallery.id);
}

/** Social metadata never reads draft content, even in an authenticated preview. */
export async function deliveryMetadata(shareId: string, isPreview: boolean): Promise<Metadata> {
    if (isPreview) return { title: 'Gallery preview · brescianifoto', openGraph: null, twitter: null };
    const data = await readDelivery(shareId);
    if (!data) return { title: 'Gallery unavailable · brescianifoto', openGraph: null, twitter: null };
    const { gallery } = data;
    const photo = featuredPhoto(data);
    const title = gallery.title;
    const url = new URL(`/deliveries/${shareId}`, getServerSideURL()).toString();
    const revision = createHash('sha256')
        .update(JSON.stringify([gallery.updatedAt, photo?.checksum, gallery.focalX ?? 50, gallery.focalY ?? 50]))
        .digest('hex')
        .slice(0, 16);
    const images = photo
        ? [
              {
                  url: `${url}/social-image?v=${revision}`,
                  ...socialImageSize,
                  alt: `${title} — featured photograph`,
                  type: 'image/jpeg',
              },
          ]
        : [];
    return {
        title: `${title} · brescianifoto`,
        openGraph: { type: 'website', title, url, images },
        twitter: { card: photo ? 'summary_large_image' : 'summary', title, images },
    };
}

/** Match CSS object-position while making a separate, color-preserving social rendition. */
export function socialCrop(width: number, height: number, focalX = 50, focalY = 50) {
    const scale = Math.max(socialImageSize.width / width, socialImageSize.height / height);
    const resizedWidth = Math.max(socialImageSize.width, Math.ceil(width * scale));
    const resizedHeight = Math.max(socialImageSize.height, Math.ceil(height * scale));
    const fraction = (value: number) => Math.max(0, Math.min(100, Number.isFinite(value) ? value : 50)) / 100;
    return {
        resizedWidth,
        resizedHeight,
        left: Math.round((resizedWidth - socialImageSize.width) * fraction(focalX)),
        top: Math.round((resizedHeight - socialImageSize.height) * fraction(focalY)),
    };
}

/** Reads the original but never stores or changes it. The caller handles storage/decode errors. */
export async function renderSocialImage(
    photo: NonNullable<ReturnType<typeof featuredPhoto>>,
    focalX: number,
    focalY: number,
) {
    const response = await fetch(await assetURL(photo.storageKey), { cache: 'no-store' });
    if (!response.ok || Number(response.headers.get('content-length')) > maxPhotoBytes) return;
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > maxPhotoBytes) return;
    const { resizedWidth, resizedHeight, left, top } = socialCrop(photo.width, photo.height, focalX, focalY);
    return sharp(bytes, { limitInputPixels: 100_000_000 })
        .rotate()
        .resize(resizedWidth, resizedHeight, { fit: 'fill' })
        .extract({ left, top, ...socialImageSize })
        .jpeg({ quality: 85 })
        .toBuffer();
}
