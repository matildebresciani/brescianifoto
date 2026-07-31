import configPromise from '@payload-config';
import { getPayload } from 'payload';
import { cache } from 'react';

export const initPayload = cache(async () => {
    return await getPayload({ config: configPromise });
});
