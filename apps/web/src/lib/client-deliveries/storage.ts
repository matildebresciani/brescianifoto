import { createHmac, timingSafeEqual } from 'node:crypto';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { z } from 'zod';

const environmentSchema = z.object({
    R2_BUCKET: z.string().min(1),
    R2_ENDPOINT: z.url(),
    R2_PUBLIC_URL: z.url(),
    R2_ACCESS_KEY_ID: z.string().min(1),
    R2_SECRET_ACCESS_KEY: z.string().min(1),
});

/** Resolve lazily so building the frontend does not contact storage. */
export function deliveryStorage() {
    const env = environmentSchema.parse(process.env);
    return {
        bucket: env.R2_BUCKET,
        publicURL: env.R2_PUBLIC_URL.replace(/\/+$/, ''),
        client: new S3Client({
            endpoint: env.R2_ENDPOINT,
            region: 'auto',
            forcePathStyle: true,
            credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
            requestChecksumCalculation: 'WHEN_REQUIRED',
            responseChecksumValidation: 'WHEN_REQUIRED',
        }),
    };
}

export function assetURL(key: string): string {
    const base = process.env.R2_PUBLIC_URL?.replace(/\/+$/, '');
    return `${base}/${key.split('/').map(encodeURIComponent).join('/')}`;
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
