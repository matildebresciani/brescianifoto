import type { Page } from '@/payload-types';
import { seededTextImageBlock } from './text-image';

export const getPage1Seed = (mediaId?: string | null): Omit<Page, 'id' | 'createdAt' | 'updatedAt'> => {
    return {
        title: 'Forside',
        name: 'Forside',
        slug: '/',
        publishStatus: 'public',
        layout: [seededTextImageBlock(mediaId)],
        ...(mediaId && {
            contentMeta: {
                featuredImage: mediaId,
            },
        }),
    };
};

export const page1Seed = getPage1Seed();
