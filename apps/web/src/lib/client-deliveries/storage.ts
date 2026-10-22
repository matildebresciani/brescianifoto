import { createHmac, timingSafeEqual } from 'node:crypto';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { z } from 'zod';

const environmentSchema = z.object({
    CLIENT_R2_BUCKET: z.string().min(1),
    CLIENT_R2_ENDPOINT: z.url(),
    CLIENT_R2_ACCESS_KEY_ID: z.string().min(1),
    CLIENT_R2_SECRET_ACCESS_KEY: z.string().min(1),
});

/** Require dedicated client settings so delivery assets never fall back to the public portfolio bucket. */
export function deliveryStorage() {
    const env = environmentSchema.parse(process.env);
    return {
        bucket: env.CLIENT_R2_BUCKET,
        client: new S3Client({
            endpoint: env.CLIENT_R2_ENDPOINT,
            region: 'auto',
            forcePathStyle: true,
            credentials: { accessKeyId: env.CLIENT_R2_ACCESS_KEY_ID, secretAccessKey: env.CLIENT_R2_SECRET_ACCESS_KEY },
            requestChecksumCalculation: 'WHEN_REQUIRED',
            responseChecksumValidation: 'WHEN_REQUIRED',
        }),
    };
}

/** Sign image reads without a public bucket or DNS changes; callers must authorize the asset first. */
export async function assetURL(key: string): Promise<string> {
    // The isolated QA fixtures serve placeholder files locally and must never require production credentials.
    if (
        process.env.NODE_ENV === 'development' &&
        !process.env.CLIENT_R2_BUCKET &&
        key.startsWith('images/client-delivery-qa/')
    ) {
        const base = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000';
        return `${base.replace(/\/+$/, '')}/${key.split('/').map(encodeURIComponent).join('/')}`;
    }
    const { client, bucket } = deliveryStorage();
    return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: 86400 });
}

export function attachmentName(filename: string): string {
    // biome-ignore lint/suspicious/noControlCharactersInRegex: Strip control characters to prevent attachment-header injection.
    const safe = filename.replace(/[\r\n"\\/\x00-\x1f]/g, '_');
    const ascii = safe.replace(/[^\x20-\x7e]/g, '_');
    return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(safe).replace(/'/g, '%27')}`;
}

export async function originalDownloadURL(key: string, filename: string): Promise<string> {
    const { client, bucket } = deliveryStorage();
    return getSignedUrl(
        client,
        new GetObjectCommand({
            Bucket: bucket,
            Key: key,
            ResponseContentDisposition: attachmentName(filename),
        }),
        { expiresIn: 900 },
    );
}

export const uploadSessionSchema = z.object({
    key: z.string(),
    uploadId: z.string(),
    galleryId: z.string(),
    originalFilename: z.string(),
    byteSize: z.number(),
    kind: z.enum(['photo', 'archive']),
    revision: z.string(),
    expiresAt: z.number(),
    userId: z.string(),
});
export type UploadSession = z.infer<typeof uploadSessionSchema>;

export function signUploadSession(session: UploadSession, secret: string): string {
    const encoded = Buffer.from(JSON.stringify(session)).toString('base64url');
    return `${encoded}.${createHmac('sha256', secret).update(encoded).digest('base64url')}`;
}

export function readUploadSession(token: string, secret: string, userId: string): UploadSession | undefined {
    const [encoded, signature, extra] = token.split('.');
    if (!encoded || !signature || extra) return;
    const expected = createHmac('sha256', secret).update(encoded).digest();
    const supplied = Buffer.from(signature, 'base64url');
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return;
    const raw = Buffer.from(encoded, 'base64url').toString('utf8');
    // Only server-signed JSON reaches parsing; the schema still guards protocol changes.
    const parsed = uploadSessionSchema.safeParse(JSON.parse(raw));
    if (!parsed.success || parsed.data.expiresAt < Date.now() || parsed.data.userId !== userId) return;
    return parsed.data;
}
