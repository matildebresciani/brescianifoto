import { createHash } from 'node:crypto';
import type { Metadata } from 'next';
import sharp from 'sharp';
import { formatPageTitle } from '@/lib/data/metadata-title';
import { getServerSideURL } from '@/lib/utilities/get-url';
import { readDelivery } from './read';
import { maxPhotoBytes, relationshipID } from './shared';
import { assetURL } from './storage';

export const socialImageSize = { width: 1200, height: 630 };
const socialImages = new Map<string, Buffer>();

/** Resolve only the currently published gallery's own featured image. */
export function featuredPhoto(data: NonNullable<Awaited<ReturnType<typeof readDelivery>>>) {
    const id = relationshipID(data.gallery.cover);
    return data.photos.find((photo) => photo.id === id && relationshipID(photo.gallery) === data.gallery.id);
}

/** Social metadata never reads draft content, even in an authenticated preview. */
export async function deliveryMetadata(shareId: string, isPreview: boolean): Promise<Metadata> {
    if (isPreview) return { title: formatPageTitle('Forhåndsvisning'), openGraph: null, twitter: null };
    const data = await readDelivery(shareId);
    if (!data) return { title: formatPageTitle('Galleriet er ikke tilgængeligt'), openGraph: null, twitter: null };
    const { gallery } = data;
    const photo = featuredPhoto(data);
    const title = formatPageTitle(gallery.title);
    const description =
        [
            gallery.date &&
                new Intl.DateTimeFormat('da-DK', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    timeZone: 'UTC',
                }).format(new Date(gallery.date)),
            gallery.location,
        ]
            .filter(Boolean)
            .join(' · ') || `Billedgalleri med ${gallery.title}.`;
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
                  alt: `${gallery.title} — forsidebillede`,
                  type: 'image/jpeg',
              },
          ]
        : [];
    return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: { type: 'website', title, description, siteName: 'brescianifoto', locale: 'da_DK', url, images },
        twitter: { card: photo ? 'summary_large_image' : 'summary', title, description, images },
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

/** Reuse up to eight derived previews in memory; the route rechecks publication before every call. */
export async function renderSocialImage(
    photo: NonNullable<ReturnType<typeof featuredPhoto>>,
    focalX: number,
    focalY: number,
) {
    const key = JSON.stringify([photo.id, photo.checksum, photo.width, photo.height, focalX, focalY]);
    const cached = socialImages.get(key);
    if (cached) {
        socialImages.delete(key);
        socialImages.set(key, cached);
        return cached;
    }
    const response = await fetch(await assetURL(photo.storageKey), { cache: 'no-store' });
    if (!response.ok || Number(response.headers.get('content-length')) > maxPhotoBytes) return;
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > maxPhotoBytes) return;
    const { resizedWidth, resizedHeight, left, top } = socialCrop(photo.width, photo.height, focalX, focalY);
    const rendered = await sharp(bytes, { limitInputPixels: 100_000_000 })
        .rotate()
        .resize(resizedWidth, resizedHeight, { fit: 'fill' })
        .extract({ left, top, ...socialImageSize })
        .jpeg({ quality: 85 })
        .toBuffer();
    socialImages.set(key, rendered);
    const oldest = socialImages.keys().next().value;
    if (socialImages.size > 8 && oldest !== undefined) socialImages.delete(oldest);
    return rendered;
}
