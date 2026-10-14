import { s3Storage } from '@payloadcms/storage-s3';
import type { Plugin } from 'payload';
import { z } from 'zod';

const r2EnvironmentSchema = z.object({
    R2_BUCKET: z.string().min(1),
    R2_ACCESS_KEY_ID: z.string().min(1),
    R2_SECRET_ACCESS_KEY: z.string().min(1),
    R2_ENDPOINT: z.url({ protocol: /^https$/ }),
    R2_PUBLIC_URL: z.url({ protocol: /^https$/ }).transform((url) => url.replace(/\/+$/, '')),
});

const isR2Enabled = process.env.NODE_ENV === 'production' || Boolean(process.env.R2_BUCKET);
// Production must have persistent storage; local development can keep using local files.
const r2Environment = isR2Enabled ? r2EnvironmentSchema.parse(process.env) : undefined;

const generateFileURL = ({ filename, prefix }: { filename: string; prefix?: string }): string => {
    const key = prefix ? `${prefix}/${encodeURIComponent(filename)}` : encodeURIComponent(filename);
    return `${r2Environment?.R2_PUBLIC_URL ?? ''}/${key}`;
};

/** Stores public portfolio assets in R2 and authorizes direct uploads for signed-in admin users. */
export const r2Storage: Plugin = s3Storage({
    enabled: isR2Enabled,
    alwaysInsertFields: true,
    clientUploads: {
        access: ({ req }) => Boolean(req.user),
    },
    collections: {
        media: {
            prefix: 'media',
            disablePayloadAccessControl: true,
            generateFileURL,
        },
        icons: {
            prefix: 'icons',
            disablePayloadAccessControl: true,
            generateFileURL,
        },
    },
    bucket: r2Environment?.R2_BUCKET ?? '',
    config: {
        credentials: {
            accessKeyId: r2Environment?.R2_ACCESS_KEY_ID ?? '',
            secretAccessKey: r2Environment?.R2_SECRET_ACCESS_KEY ?? '',
        },
        endpoint: r2Environment?.R2_ENDPOINT,
        region: 'auto',
        forcePathStyle: true,
    },
});
