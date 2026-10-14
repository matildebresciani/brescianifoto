import type { CollectionAfterReadHook } from 'payload';
import type { Icon, Media } from '@/payload-types';

/** Resolves the admin preview after storage field hooks have generated the thumbnail URL. */
export const resolveAdminThumbnail: CollectionAfterReadHook<Media | Icon> = ({ doc }) => {
    // Payload builds thumbnailURL from the raw document before the storage adapter resolves size URLs.
    return {
        ...doc,
        thumbnailURL: doc.sizes?.thumbnail?.url ?? doc.thumbnailURL,
    };
};
