import type { Post } from '@/payload-types';
import { seededParagraphBlock } from './paragraph';

export const getPost2Seed = (mediaId?: string | null): Omit<Post, 'id' | 'createdAt' | 'updatedAt'> => {
    return {
        title: 'ECommerce Trends for 2024',
        name: 'Post 2',
        slug: 'post-2',
        publishStatus: 'public',
        layout: [seededParagraphBlock()],
        ...(mediaId && {
            contentMeta: {
                featuredImage: mediaId,
                excerpt:
                    'Explore the latest ecommerce trends for 2024. From AI integration to personalization strategies, stay ahead of the competition.',
            },
        }),
    };
};

export const post2Seed = getPost2Seed();
