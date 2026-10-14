import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FixedToolbarFeature, InlineToolbarFeature, lexicalEditor } from '@payloadcms/richtext-lexical';
import type { CollectionConfig } from 'payload';

import { anyone } from '../../../access/anyone';
import { authenticated } from '../../../access/authenticated';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export const Media: CollectionConfig = {
    slug: 'media',
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
        {
            name: 'caption',
            type: 'richText',
            localized: true,
            editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                    return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()];
                },
            }),
        },
    ],
    upload: {
        // Upload to the public/media directory in Next.js making them publicly accessible even outside of Payload
        staticDir: path.resolve(dirname, '../../../../public/uploads/media'),
        adminThumbnail: 'thumbnail',
        focalPoint: true,
        // Next.js optimizes the original for the frontend; only the admin needs a stored derivative.
        imageSizes: [
            {
                name: 'thumbnail',
                width: 300,
            },
        ],
    },
};
