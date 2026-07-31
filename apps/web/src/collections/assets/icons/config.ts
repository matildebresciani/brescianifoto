import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CollectionConfig } from 'payload';

import { anyone } from '../../../access/anyone';
import { authenticated } from '../../../access/authenticated';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export const Icons: CollectionConfig = {
    slug: 'icons',
    admin: {
        group: 'Assets',
    },
    access: {
        create: authenticated,
        delete: authenticated,
        read: anyone,
        update: authenticated,
    },
    fields: [
        {
            name: 'alt',
            type: 'text',
            localized: true,
        },
    ],
    upload: {
        // Upload to the public/media directory in Next.js making them publicly accessible even outside of Payload
        staticDir: path.resolve(dirname, '../../public/icons'),
        adminThumbnail: 'thumbnail',
        focalPoint: true,
        imageSizes: [
            {
                name: 'thumbnail',
                width: 300,
            },
            {
                name: 'square',
                width: 500,
                height: 500,
            },
        ],
    },
};
