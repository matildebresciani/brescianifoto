import {
    createAfterChangeRevalidateHook,
    createAfterDeleteRevalidateHook,
} from '@/lib/payload-hooks/revalidate-content';

const slug = 'posts';

export const revalidatePost = createAfterChangeRevalidateHook(slug);
export const revalidateDelete = createAfterDeleteRevalidateHook(slug);
