import type { CollectionConfig } from 'payload';
import { authenticated } from '@/access/authenticated';
import { assetURL } from '@/lib/client-deliveries/storage';

const access = {
    read: authenticated,
    // Only the verified upload completion endpoint may create or mutate storage records.
    create: () => false,
    update: () => false,
    delete: () => false,
};

const fields: CollectionConfig['fields'] = [
    { name: 'gallery', type: 'relationship', relationTo: 'client-galleries', required: true, index: true },
    { name: 'originalFilename', type: 'text', required: true },
    { name: 'storageKey', type: 'text', required: true, unique: true, index: true, admin: { hidden: true } },
    { name: 'byteSize', type: 'number', required: true },
    { name: 'mimeType', type: 'text', required: true },
];

/** Native upload UI backed by verified external objects; only the completion endpoint writes records. */
export const ClientPhotos: CollectionConfig = {
    slug: 'client-photos',
    access,
    upload: {
        disableLocalStorage: true,
        filesRequiredOnCreate: false,
        crop: false,
        focalPoint: false,
        mimeTypes: ['image/jpeg'],
        adminThumbnail: ({ doc }) => (typeof doc.thumbnailURL === 'string' ? doc.thumbnailURL : null),
    },
    hooks: {
        afterRead: [
            async ({ doc }) => {
                const thumbnailURL =
                    typeof doc.thumbnailKey === 'string' ? await assetURL(doc.thumbnailKey) : undefined;
                return {
                    ...doc,
                    // Adapt legacy records too: IDs and stored object keys do not change.
                    filename: doc.originalFilename,
                    filesize: doc.byteSize,
                    url: typeof doc.storageKey === 'string' ? await assetURL(doc.storageKey) : undefined,
                    thumbnailURL,
                    // The Media gallery plugin reads sizes.thumbnail instead of adminThumbnail.
                    sizes: { thumbnail: { url: thumbnailURL, mimeType: 'image/webp' } },
                };
            },
        ],
    },
    admin: {
        hidden: true,
        group: 'Client delivery',
        useAsTitle: 'originalFilename',
        description: 'Upload photos from their client gallery. These files never enter the public portfolio.',
        defaultColumns: ['filename', 'byteSize'],
    },
    fields: [
        ...fields,
        { name: 'width', type: 'number', required: true },
        { name: 'height', type: 'number', required: true },
        { name: 'checksum', type: 'text', required: true, admin: { readOnly: true } },
        { name: 'thumbnailKey', type: 'text', required: true, admin: { hidden: true } },
    ],
};

export const ClientDownloads: CollectionConfig = {
    slug: 'client-downloads',
    access,
    admin: {
        hidden: true,
        group: 'Client delivery',
        useAsTitle: 'originalFilename',
        description: 'Upload ZIP archives from their client gallery. Confirm the photo revision before sharing.',
    },
    fields: [...fields, { name: 'photoRevision', type: 'text', required: true, admin: { readOnly: true } }],
};
