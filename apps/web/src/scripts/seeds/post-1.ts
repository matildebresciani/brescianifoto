import type { Post } from '@/payload-types';
import { seededParagraphBlock } from './paragraph';

export const getPost1Seed = (mediaId?: string | null): Omit<Post, 'id' | 'createdAt' | 'updatedAt'> => {
    return {
        title: 'Why obundle is Your Top Choice',
        name: 'Post 1',
        slug: 'post-1',
        publishStatus: 'public',
        layout: [seededParagraphBlock()],
        ...(mediaId && {
            contentMeta: {
                featuredImage: mediaId,
                excerpt:
                    'Discover why obundle is the top choice for modern businesses. Learn about its key features and benefits.',
            },
        }),
    };
};

export const post1Seed = getPost1Seed();
