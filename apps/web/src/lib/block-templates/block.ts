import type { Block } from 'payload';
import { getThumbnailUrl } from '../utilities/composables';

export const createBlock = (slug: string, config: Omit<Block, 'slug'>): Block => {
    return {
        slug,
        imageURL: getThumbnailUrl(slug),
        ...config,
    };
};
