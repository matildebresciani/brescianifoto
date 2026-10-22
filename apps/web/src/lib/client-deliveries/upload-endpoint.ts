import { randomUUID } from 'node:crypto';
import {
    AbortMultipartUploadCommand,
    CompleteMultipartUploadCommand,
    CreateMultipartUploadCommand,
    DeleteObjectCommand,
    GetObjectCommand,
    HeadObjectCommand,
    PutObjectCommand,
    UploadPartCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Result, ResultAsync } from 'neverthrow';
import type { Endpoint, PayloadRequest } from 'payload';
import { z } from 'zod';
import { inspectOriginalJPEG } from './photo';
import { maxArchiveBytes, maxPhotoBytes, uploadPartSize } from './shared';
import { attachmentName, deliveryStorage, readUploadSession, signUploadSession, type UploadSession } from './storage';

const requestSchema = z.discriminatedUnion('action', [
    z.object({
        action: z.literal('start'),
        galleryId: z.string(),
        filename: z.string().min(1).max(240),
        byteSize: z.number().int().positive(),
        kind: z.enum(['photo', 'archive']),
    }),
    z.object({ action: z.literal('sign'), token: z.string(), part: z.number().int().positive() }),
    z.object({
        action: z.literal('complete'),
        token: z.string(),
        parts: z
            .array(z.object({ PartNumber: z.number().int().positive(), ETag: z.string().min(1) }))
            .min(1)
            .max(2000),
    }),
    z.object({ action: z.literal('cancel'), token: z.string() }),
]);

const fail = (error: string, status = 400) => Response.json({ error }, { status });

async function galleryForUpload(req: PayloadRequest, id: string) {
    const result = await req.payload.find({
        collection: 'client-galleries',
        where: { id: { equals: id } },
        limit: 1,
        depth: 0,
        draft: true,
        overrideAccess: false,
        req,
    });
    return result.docs[0];
}

async function completedRecord(req: PayloadRequest, session: UploadSession) {
    const result = await req.payload.find({
        collection: session.kind === 'photo' ? 'client-photos' : 'client-downloads',
        where: { storageKey: { equals: session.key } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
        req,
    });
    return result.docs[0];
}

async function handleUpload(req: PayloadRequest): Promise<Response> {
    if (!req.user) return fail('Sign in to upload client files.', 401);
    const parsed = requestSchema.safeParse(await req.json?.());
    if (!parsed.success) return fail('Invalid upload request.');
    const body = parsed.data;
    const storage = Result.fromThrowable(
        deliveryStorage,
        () => 'Client storage is not configured. Configure R2 before uploading.',
    )();
    if (storage.isErr()) return fail(storage.error, 503);
    const { client, bucket } = storage.value;
    if (body.action === 'start') {
        const isPhoto = body.kind === 'photo';
        const maximum = isPhoto ? maxPhotoBytes : maxArchiveBytes;
        if (body.byteSize > maximum || !(isPhoto ? /\.jpe?g$/i : /\.zip$/i).test(body.filename)) {
            return fail(isPhoto ? 'Upload a JPEG no larger than 50 MB.' : 'Upload a ZIP no larger than 25 GB.');
        }
        const gallery = await galleryForUpload(req, body.galleryId);
        if (!gallery) return fail('Save the client gallery before uploading.', 404);
        const key = `client-deliveries/${gallery.id}/${isPhoto ? 'photos' : 'downloads'}/${randomUUID()}.${isPhoto ? 'jpg' : 'zip'}`;
        const upload = await client.send(
            new CreateMultipartUploadCommand({
                Bucket: bucket,
                Key: key,
                ContentType: isPhoto ? 'image/jpeg' : 'application/zip',
                ContentDisposition: attachmentName(body.filename),
                CacheControl: 'public, max-age=31536000, immutable',
            }),
        );
        if (!upload.UploadId) return fail('Storage did not create an upload. Please retry.', 502);
        const token = signUploadSession(
            {
                key,
                uploadId: upload.UploadId,
                galleryId: gallery.id,
                originalFilename: body.filename,
                byteSize: body.byteSize,
                kind: body.kind,
                revision: gallery.photoRevision || '',
                expiresAt: Date.now() + 24 * 60 * 60 * 1000,
                userId: String(req.user.id),
            },
            req.payload.config.secret,
        );
        return Response.json({ token, partSize: uploadPartSize });
    }
    const session = readUploadSession(body.token, req.payload.config.secret, String(req.user.id));
    if (!session) return fail('Upload session expired. Start the upload again.', 410);
    const identity = { Bucket: bucket, Key: session.key, UploadId: session.uploadId };
    if (body.action === 'cancel') {
        await client.send(new AbortMultipartUploadCommand(identity));
        return Response.json({ cancelled: true });
    }
    if (!(await galleryForUpload(req, session.galleryId))) return fail('Gallery no longer exists.', 404);
    const partCount = Math.ceil(session.byteSize / uploadPartSize);
    if (body.action === 'sign') {
        if (body.part > partCount) return fail('Invalid part number.');
        const url = await getSignedUrl(client, new UploadPartCommand({ ...identity, PartNumber: body.part }), {
            expiresIn: 3600,
        });
        return Response.json({ url });
    }
    const existing = await completedRecord(req, session);
    if (existing) return Response.json({ id: existing.id });
    const parts = [...body.parts].sort((a, b) => a.PartNumber - b.PartNumber);
    if (parts.length !== partCount || parts.some((part, index) => part.PartNumber !== index + 1))
        return fail('Upload is missing parts. Retry it.');
    // A retry after a successful completion but failed DB save must not complete the multipart upload twice.
    const head = await ResultAsync.fromPromise(
        client.send(new HeadObjectCommand({ Bucket: bucket, Key: session.key })),
        () => undefined,
    );
    if (head.isErr())
        await client.send(new CompleteMultipartUploadCommand({ ...identity, MultipartUpload: { Parts: parts } }));
    const object = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: session.key }));
    if (object.ContentLength !== session.byteSize) {
        await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: session.key }));
        return fail('Stored file size does not match the upload. Start the upload again.', 409);
    }
    const common = {
        gallery: session.galleryId,
        storageKey: session.key,
        originalFilename: session.originalFilename,
        byteSize: session.byteSize,
    };
    if (session.kind === 'archive') {
        const firstBytes = await client.send(
            new GetObjectCommand({ Bucket: bucket, Key: session.key, Range: 'bytes=0-3' }),
        );
        const signature = Buffer.from((await firstBytes.Body?.transformToByteArray()) ?? []).toString('hex');
        if (!['504b0304', '504b0506', '504b0708'].includes(signature)) {
            await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: session.key }));
            return fail('This file is not a ZIP archive.');
        }
        const archive = await req.payload.create({
            collection: 'client-downloads',
            overrideAccess: true,
            req,
            data: { ...common, mimeType: 'application/zip', photoRevision: session.revision },
        });
        return Response.json({ id: archive.id });
    }
    const source = await client.send(new GetObjectCommand({ Bucket: bucket, Key: session.key }));
    const bytes = Buffer.from((await source.Body?.transformToByteArray()) ?? []);
    const inspected = await inspectOriginalJPEG(bytes);
    if (inspected.isErr()) {
        await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: session.key }));
        return fail(inspected.error);
    }
    const { checksum, thumbnail, width, height } = inspected.value;
    const photoPrefix = `client-deliveries/${session.galleryId}/photos/`;
    // Preserve the thumbnail location for multipart sessions started before gallery folders were introduced.
    const thumbnailKey = session.key.startsWith(photoPrefix)
        ? `client-deliveries/${session.galleryId}/thumbnails/${session.key.slice(photoPrefix.length).replace(/\.jpg$/, '.webp')}`
        : `${session.key}.thumb.webp`;
    await client.send(
        new PutObjectCommand({
            Bucket: bucket,
            Key: thumbnailKey,
            Body: thumbnail,
            ContentType: 'image/webp',
            CacheControl: 'public, max-age=31536000, immutable',
        }),
    );
    const photo = await req.payload.create({
        collection: 'client-photos',
        overrideAccess: true,
        req,
        data: {
            ...common,
            mimeType: 'image/jpeg',
            checksum,
            thumbnailKey,
            width,
            height,
        },
    });
    return Response.json({ id: photo.id });
}

export const deliveryUploadEndpoint: Endpoint = {
    path: '/client-delivery/upload',
    method: 'post',
    handler: async (req) => {
        const result = await ResultAsync.fromPromise(handleUpload(req), (error) => error);
        if (result.isOk()) return result.value;
        req.payload.logger.error({ err: result.error, msg: 'Client delivery upload failed' });
        return fail('The upload could not finish. Retry the file; completed parts are retained for 24 hours.', 502);
    },
};
