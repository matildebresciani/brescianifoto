import { initPayload } from '@/lib/config';
import type { ClientPhoto } from '@/payload-types';
import { photoSetRevision } from './revision';
import {
    relationshipID,
    resolveSectionTheme,
    sectionMenuLabel,
    selectedPhotoIDs,
    themeDefaults,
    themeSchema,
} from './shared';
import { assetURL } from './storage';
import type { DeliveryBlock, DeliveryPhoto, DeliveryView, PhotoSpacing } from './view';

const photoSpacingByOption = { '0': 0, '2': 2, '4': 4, '8': 8 } satisfies Record<string, PhotoSpacing>;

/** This is the only anonymous document read; never use client collections in generic public queries. */
export async function readDelivery(shareId: string, isPreview = false, requestHeaders?: Headers) {
    if (!/^[\w-]{32}$/.test(shareId)) return;
    const payload = await initPayload();
    if (isPreview) {
        if (!requestHeaders) return;
        const { user } = await payload.auth({ headers: requestHeaders });
        if (!user) return;
    }
    const result = await payload.find({
        collection: 'client-galleries',
        where: {
            and: [{ shareId: { equals: shareId } }, ...(isPreview ? [] : [{ _status: { equals: 'published' } }])],
        },
        draft: isPreview,
        overrideAccess: true,
        depth: 0,
        limit: 1,
    });
    const gallery = result.docs[0];
    if (!gallery) return;
    const selected = selectedPhotoIDs(gallery.blocks);
    const coverID = relationshipID(gallery.cover);
    const ids = [...new Set([...selected, ...(coverID ? [coverID] : [])])];
    const photos = ids.length
        ? (
              await payload.find({
                  collection: 'client-photos',
                  where: { and: [{ gallery: { equals: gallery.id } }, { id: { in: ids } }] },
                  limit: 501,
                  depth: 0,
                  overrideAccess: true,
              })
          ).docs
        : [];
    const archiveID = relationshipID(gallery.archive);
    const archive = archiveID
        ? (
              await payload.find({
                  collection: 'client-downloads',
                  where: { and: [{ id: { equals: archiveID } }, { gallery: { equals: gallery.id } }] },
                  limit: 1,
                  depth: 0,
                  overrideAccess: true,
              })
          ).docs[0]
        : undefined;
    const revision = photoSetRevision(photos.filter((photo) => selected.includes(photo.id)));
    const isArchiveCurrent = Boolean(archive && gallery.archiveRevision === revision && selected.length > 0);
    return { gallery, photos, archive, isArchiveCurrent };
}

export async function deliveryView(
    data: NonNullable<Awaited<ReturnType<typeof readDelivery>>>,
    isPreview: boolean,
): Promise<DeliveryView> {
    const { gallery, photos, archive, isArchiveCurrent } = data;
    const signingTime = new Date();
    const toPhoto = async (photo: ClientPhoto): Promise<DeliveryPhoto> => ({
        id: photo.id,
        src: await assetURL(photo.storageKey, signingTime),
        imageVersion: photoSetRevision([photo]),
        width: photo.width,
        height: photo.height,
        name: photo.originalFilename,
        createdAt: photo.createdAt,
        updatedAt: photo.updatedAt,
        ...(gallery.canDownloadPhotos
            ? { downloadHref: `/deliveries/${gallery.shareId}/download/${photo.id}${isPreview ? '?preview=1' : ''}` }
            : {}),
    });
    const signedPhotos = await Promise.all(photos.map(toPhoto));
    const byID = new Map(signedPhotos.map((photo) => [photo.id, photo]));
    const blocks: DeliveryBlock[] = [];
    const theme = themeSchema.parse(gallery.theme ?? {});
    for (const block of gallery.blocks ?? []) {
        const sectionTheme = resolveSectionTheme(theme, block.colors);
        if (block.blockType === 'text') {
            if (block.content)
                blocks.push({
                    id: block.id || `text-${blocks.length}`,
                    type: 'text',
                    content: block.content,
                    ...sectionTheme,
                });
            continue;
        }
        const items = (block.photos ?? []).flatMap((photo) => {
            const id = relationshipID(photo);
            const resolved = id ? byID.get(id) : undefined;
            return resolved ? [resolved] : [];
        });
        if (items.length && block.anchor)
            blocks.push({
                id: block.id || block.anchor,
                type: 'photos',
                anchor: block.anchor,
                menuLabel: sectionMenuLabel(block),
                photos: items,
                introduction: block.introduction,
                ...sectionTheme,
            });
    }
    const coverID = relationshipID(gallery.cover);
    const cover = coverID ? byID.get(coverID) : undefined;
    return {
        title: gallery.title,
        date: gallery.date,
        location: gallery.location,
        details: gallery.details,
        cover,
        coverLayout: gallery.coverLayout || 'editorial',
        desktopColumns: gallery.desktopColumns === '3' ? 3 : 4,
        photoSpacing: photoSpacingByOption[gallery.photoSpacing ?? '2'],
        overlayColor: gallery.overlayColor || themeDefaults.text,
        overlayOpacity: gallery.overlayOpacity ?? 72,
        alignment: gallery.alignment || 'center',
        focalX: gallery.focalX ?? 50,
        focalY: gallery.focalY ?? 50,
        theme,
        blocks,
        isPreview,
        photoCount: new Set(
            blocks.flatMap((block) => (block.type === 'photos' ? block.photos.map((photo) => photo.id) : [])),
        ).size,
        ...(archive && isArchiveCurrent && gallery.canDownloadArchive
            ? {
                  archive: {
                      href: `/deliveries/${gallery.shareId}/download/${archive.id}${isPreview ? '?preview=1' : ''}`,
                      byteSize: archive.byteSize,
                  },
              }
            : {}),
    };
}
