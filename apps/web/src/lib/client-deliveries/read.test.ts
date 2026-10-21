import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ClientDownload, ClientGallery, ClientPhoto } from '@/payload-types';
import { deliveryView, readDelivery } from './read';
import { photoSetRevision } from './revision';

const mocks = vi.hoisted(() => ({ find: vi.fn(), auth: vi.fn() }));
vi.mock('@/lib/config', () => ({ initPayload: async () => mocks }));
const now = '2026-10-21T00:00:00.000Z';
const photo: ClientPhoto = {
    id: 'photo-1',
    gallery: 'gallery-1',
    originalFilename: '01.jpg',
    storageKey: 'client-deliveries/random/01.jpg',
    byteSize: 5000000,
    mimeType: 'image/jpeg',
    width: 4000,
    height: 6000,
    checksum: 'checksum',
    thumbnailKey: 'thumb.webp',
    createdAt: now,
    updatedAt: now,
};
const archive: ClientDownload = {
    id: 'archive-1',
    gallery: 'gallery-1',
    originalFilename: 'Wedding.zip',
    storageKey: 'random.zip',
    byteSize: 99999,
    mimeType: 'application/zip',
    photoRevision: photoSetRevision([photo]),
    createdAt: now,
    updatedAt: now,
};
const gallery: ClientGallery = {
    id: 'gallery-1',
    name: 'Private internal notes',
    title: 'Alex & Jamie',
    shareId: 'a'.repeat(32),
    cover: photo.id,
    canDownloadArchive: true,
    canDownloadPhotos: true,
    archive: archive.id,
    archiveRevision: archive.photoRevision,
    _status: 'published',
    createdAt: now,
    updatedAt: now,
    blocks: [
        { blockType: 'photos', id: 'section-1', title: 'Ceremony', anchor: 'section-stable', photos: [photo.id] },
        { blockType: 'photos', id: 'section-2', title: 'Empty', photos: [] },
    ],
};

beforeEach(() => {
    mocks.find.mockImplementation(async ({ collection }: { collection: string }) => ({
        docs: collection === 'client-galleries' ? [gallery] : collection === 'client-photos' ? [photo] : [archive],
    }));
    mocks.auth.mockResolvedValue({ user: null });
});

describe('unlisted delivery reads', () => {
    it('projects photo introductions and themes without affecting neighboring sections', () => {
        const content = {
            root: { type: 'root', children: [], direction: null, format: '', indent: 0, version: 1 },
        } satisfies NonNullable<
            Extract<NonNullable<ClientGallery['blocks']>[number], { blockType: 'text' }>['content']
        >;
        const view = deliveryView(
            {
                gallery: {
                    ...gallery,
                    blocks: [
                        {
                            blockType: 'photos',
                            title: 'Ceremony',
                            anchor: 'one',
                            photos: [photo.id],
                            introduction: content,
                            colors: { background: '#151611', text: '#FAFFEF' },
                        },
                        { blockType: 'photos', title: 'Reception', anchor: 'two', photos: [photo.id] },
                        { blockType: 'text', content, colors: { background: '#FFFFFF', text: '#000000' } },
                    ],
                },
                photos: [photo],
                archive: undefined,
                isArchiveCurrent: false,
            },
            false,
        );
        expect(view.blocks[0]).toMatchObject({
            introduction: content,
            hasCustomColors: true,
            theme: { background: '#151611', text: '#FAFFEF', muted: '#FAFFEF' },
        });
        expect(view.blocks[1]).toMatchObject({ hasCustomColors: false, theme: view.theme });
        expect(view.blocks[2]).toMatchObject({
            content,
            hasCustomColors: true,
            theme: { background: '#FFFFFF', text: '#000000' },
        });
    });
    it('does not query for invalid links or allow unauthenticated draft previews', async () => {
        expect(await readDelivery('guessable-slug')).toBeUndefined();
        expect(await readDelivery('a'.repeat(32), true, new Headers())).toBeUndefined();
        expect(mocks.find).not.toHaveBeenCalled();
    });
    it('requires publication for anonymous reads and scopes all assets to the gallery', async () => {
        const data = await readDelivery('a'.repeat(32));
        expect(data?.isArchiveCurrent).toBe(true);
        expect(mocks.find.mock.calls[0]?.[0]).toMatchObject({
            draft: false,
            where: { and: [{ shareId: { equals: 'a'.repeat(32) } }, { _status: { equals: 'published' } }] },
        });
        expect(mocks.find.mock.calls[1]?.[0].where.and).toContainEqual({ gallery: { equals: gallery.id } });
        expect(mocks.find.mock.calls[2]?.[0].where.and).toContainEqual({ gallery: { equals: gallery.id } });
    });
    it('permits draft reads only for a signed-in administrator', async () => {
        mocks.auth.mockResolvedValue({ user: { id: 'admin' } });
        await readDelivery('a'.repeat(32), true, new Headers());
        expect(mocks.find.mock.calls[0]?.[0]).toMatchObject({ draft: true });
    });
    it('hides stale ZIPs and omits internal data and empty sections from the visitor projection', async () => {
        mocks.find.mockImplementation(async ({ collection }: { collection: string }) => ({
            docs:
                collection === 'client-galleries'
                    ? [{ ...gallery, archiveRevision: 'old-revision' }]
                    : collection === 'client-photos'
                      ? [photo]
                      : [archive],
        }));
        const data = await readDelivery('a'.repeat(32));
        expect(data).toBeDefined();
        if (!data) return;
        const view = deliveryView(data, false);
        expect(view.archive).toBeUndefined();
        expect(view.blocks).toHaveLength(1);
        expect(view.photoCount).toBe(1);
        expect(JSON.stringify(view)).not.toContain('Private internal notes');
        expect(JSON.stringify(view)).not.toContain('checksum');
    });
    it('handles 500 photos as metadata without fetching original files', async () => {
        const photos = Array.from({ length: 500 }, (_, index) => ({ ...photo, id: `photo-${index}` }));
        mocks.find.mockImplementation(async ({ collection }: { collection: string }) => ({
            docs:
                collection === 'client-galleries'
                    ? [
                          {
                              ...gallery,
                              blocks: [
                                  {
                                      blockType: 'photos',
                                      title: 'Wedding',
                                      anchor: 'section-wedding',
                                      photos: photos.map((item) => item.id),
                                  },
                              ],
                          },
                      ]
                    : collection === 'client-photos'
                      ? photos
                      : [archive],
        }));
        const data = await readDelivery('a'.repeat(32));
        if (!data) throw new Error('Expected gallery');
        expect(deliveryView(data, false).photoCount).toBe(500);
        expect(mocks.find).toHaveBeenCalledTimes(3);
    });
});
