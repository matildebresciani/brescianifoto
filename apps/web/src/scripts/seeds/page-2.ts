import type { Page } from '@/payload-types';
import { seededTextImageBlock } from './text-image';

export const getPage2Seed = (mediaId?: string | null): Omit<Page, 'id' | 'createdAt' | 'updatedAt'> => {
    return {
        title: 'Side 2',
        name: 'Side 2',
        slug: 'page-2',
        publishStatus: 'public',
        layout: [seededTextImageBlock(mediaId)],
        ...(mediaId && {
            contentMeta: {
                featuredImage: mediaId,
            },
        }),
    };
};

export const page2Seed = getPage2Seed();
