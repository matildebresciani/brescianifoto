import { createHash } from 'node:crypto';
import {
    AbortMultipartUploadCommand,
    CompleteMultipartUploadCommand,
    CreateMultipartUploadCommand,
    GetObjectCommand,
    HeadObjectCommand,
    PutObjectCommand,
} from '@aws-sdk/client-s3';
import { mongooseAdapter } from '@payloadcms/db-mongodb';
import { BasePayload, buildConfig, createLocalReq } from 'payload';
import sharp from 'sharp';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { signUploadSession } from './storage';
import { deliveryUploadEndpoint } from './upload-endpoint';

const mocks = vi.hoisted(() => ({ send: vi.fn(), find: vi.fn(), create: vi.fn() }));
vi.mock('./storage', async (importOriginal) => ({
    ...(await importOriginal<typeof import('./storage')>()),
    deliveryStorage: () => ({ client: { send: mocks.send }, bucket: 'test-bucket', publicURL: 'https://test.invalid' }),
}));
vi.mock('@aws-sdk/s3-request-presigner', () => ({ getSignedUrl: async () => 'https://test.invalid/signed-part' }));

// The real Payload request builder supplies framework context without opening a DB connection.
const config = buildConfig({
    secret: 'upload-test-secret',
    collections: [{ slug: 'users', auth: true, fields: [] }],
    db: mongooseAdapter({ url: 'mongodb://localhost/unused' }),
});
const payload = new BasePayload();
const user = {
    id: 'admin',
    email: 'admin@example.test',
    collection: 'users',
    createdAt: '',
    updatedAt: '',
} satisfies NonNullable<Awaited<ReturnType<typeof createLocalReq>>['user']>;
let bytes: Buffer;
let headCount = 0;
const session = () =>
    ({
        key: 'client-deliveries/random/original.jpg',
        uploadId: 'upload-id',
        galleryId: 'gallery',
        originalFilename: 'Wedding.jpg',
        byteSize: bytes.length,
        kind: 'photo',
        revision: 'photo-set',
        expiresAt: Date.now() + 60000,
        userId: user.id,
    }) satisfies Parameters<typeof signUploadSession>[0];

async function call(body: unknown, isSignedIn = true) {
    const req = await createLocalReq({ user: isSignedIn ? user : undefined, req: { json: async () => body } }, payload);
    return deliveryUploadEndpoint.handler(req);
}

beforeEach(async () => {
    payload.config = await config;
    payload.find = mocks.find;
    payload.create = mocks.create;
    bytes = await sharp({ create: { width: 600, height: 400, channels: 3, background: '#cabbaa' } })
        .jpeg()
        .withMetadata()
        .toBuffer();
    headCount = 0;
    mocks.find.mockImplementation(async ({ collection }: { collection: string }) => ({
        docs: collection === 'client-galleries' ? [{ id: 'gallery', photoRevision: 'photo-set' }] : [],
    }));
    mocks.create.mockResolvedValue({ id: 'created-photo' });
    mocks.send.mockImplementation(async (command: unknown) => {
        if (command instanceof CreateMultipartUploadCommand) return { UploadId: 'upload-id' };
        if (command instanceof HeadObjectCommand) {
            if (headCount++ === 0) throw new Error('Object not completed yet');
            return { ContentLength: bytes.length };
        }
        if (command instanceof GetObjectCommand)
            return { Body: { transformToByteArray: async () => (command.input.Range ? bytes.subarray(0, 4) : bytes) } };
        return {};
    });
});

describe('multipart upload completion', () => {
    it('denies anonymous uploads before touching storage', async () => {
        expect((await call({ action: 'start' }, false)).status).toBe(401);
        expect(mocks.send).not.toHaveBeenCalled();
    });
    it.each([
        'gallery',
        'another-gallery',
    ])('groups duplicate photo names under %s with unique keys', async (galleryId) => {
        mocks.find.mockResolvedValue({ docs: [{ id: galleryId, photoRevision: 'photo-set' }] });
        for (let index = 0; index < 2; index++) {
            const response = await call({
                action: 'start',
                galleryId,
                filename: 'Wedding.jpg',
                byteSize: bytes.length,
                kind: 'photo',
            });
            expect(response.status).toBe(200);
        }
        const keys = mocks.send.mock.calls.flatMap(([command]) =>
            command instanceof CreateMultipartUploadCommand ? [command.input.Key] : [],
        );
        expect(keys).toHaveLength(2);
        expect(new Set(keys).size).toBe(2);
        for (const key of keys) {
            expect(key).toMatch(new RegExp(`^client-deliveries/${galleryId}/photos/[a-f0-9-]+\\.jpg$`));
        }
    });
    it.each([
        ['client-deliveries/random/original.jpg', 'client-deliveries/random/original.jpg.thumb.webp'],
        ['client-deliveries/gallery/photos/original.jpg', 'client-deliveries/gallery/thumbnails/original.webp'],
    ])('preserves originals and creates the separate thumbnail for %s', async (key, thumbnailKey) => {
        const token = signUploadSession({ ...session(), key }, payload.config.secret);
        const response = await call({ action: 'complete', token, parts: [{ PartNumber: 1, ETag: 'part-etag' }] });
        expect(response.status).toBe(200);
        expect(mocks.send.mock.calls.some(([command]) => command instanceof CompleteMultipartUploadCommand)).toBe(true);
        const writes = mocks.send.mock.calls.flatMap(([command]) =>
            command instanceof PutObjectCommand ? [command.input] : [],
        );
        expect(writes).toHaveLength(1);
        expect(writes[0]?.Key).toBe(thumbnailKey);
        expect(mocks.create.mock.calls[0]?.[0].data).toMatchObject({ storageKey: key, thumbnailKey });
        expect(mocks.create.mock.calls[0]?.[0].data.checksum).toBe(createHash('sha256').update(bytes).digest('hex'));
    });
    it('makes completion retries idempotent after a saved asset', async () => {
        mocks.find.mockImplementation(async ({ collection }: { collection: string }) => ({
            docs: collection === 'client-galleries' ? [{ id: 'gallery' }] : [{ id: 'already-saved' }],
        }));
        const response = await call({
            action: 'complete',
            token: signUploadSession(session(), payload.config.secret),
            parts: [{ PartNumber: 1, ETag: 'etag' }],
        });
        expect(await response.json()).toEqual({ id: 'already-saved' });
        expect(mocks.send).not.toHaveBeenCalled();
        expect(mocks.create).not.toHaveBeenCalled();
    });
    it('rejects missing/duplicate parts and expired sessions', async () => {
        const token = signUploadSession(session(), payload.config.secret);
        expect((await call({ action: 'complete', token, parts: [{ PartNumber: 2, ETag: 'etag' }] })).status).toBe(400);
        expect(
            (
                await call({
                    action: 'complete',
                    token,
                    parts: [
                        { PartNumber: 1, ETag: 'a' },
                        { PartNumber: 1, ETag: 'b' },
                    ],
                })
            ).status,
        ).toBe(400);
        expect(
            (
                await call({
                    action: 'sign',
                    token: signUploadSession({ ...session(), expiresAt: 0 }, payload.config.secret),
                    part: 1,
                })
            ).status,
        ).toBe(410);
    });
    it('aborts a cancelled multipart upload without creating an asset', async () => {
        expect(
            (await call({ action: 'cancel', token: signUploadSession(session(), payload.config.secret) })).status,
        ).toBe(200);
        expect(mocks.send.mock.calls[0]?.[0]).toBeInstanceOf(AbortMultipartUploadCommand);
        expect(mocks.create).not.toHaveBeenCalled();
    });
    it('rejects a file over the documented JPEG size limit', async () => {
        const response = await call({
            action: 'start',
            galleryId: 'gallery',
            filename: 'Wedding.jpg',
            byteSize: 51 * 1024 ** 2,
            kind: 'photo',
        });
        expect(response.status).toBe(400);
        expect(mocks.send).not.toHaveBeenCalled();
    });
    it('starts a multi-gigabyte ZIP as multipart without transferring its bytes through the endpoint', async () => {
        const response = await call({
            action: 'start',
            galleryId: 'gallery',
            filename: 'Wedding.zip',
            byteSize: 6 * 1024 ** 3,
            kind: 'archive',
        });
        expect(response.status).toBe(200);
        expect(mocks.send.mock.calls).toHaveLength(1);
        const command = mocks.send.mock.calls[0]?.[0];
        expect(command).toBeInstanceOf(CreateMultipartUploadCommand);
        expect(command.input.ContentType).toBe('application/zip');
        expect(command.input.ContentDisposition).toContain('Wedding.zip');
        expect(command.input.Key).toMatch(/^client-deliveries\/gallery\/downloads\/[a-f0-9-]+\.zip$/);
    });
    it('verifies an archive header and binds it to the photo revision from upload start', async () => {
        bytes = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0]);
        const token = signUploadSession(
            { ...session(), kind: 'archive', key: 'client-deliveries/random/archive.zip' },
            payload.config.secret,
        );
        expect((await call({ action: 'complete', token, parts: [{ PartNumber: 1, ETag: 'etag' }] })).status).toBe(200);
        expect(mocks.create.mock.calls[0]?.[0]).toMatchObject({
            collection: 'client-downloads',
            data: { photoRevision: 'photo-set', mimeType: 'application/zip' },
        });
        expect(mocks.send.mock.calls.some(([command]) => command instanceof PutObjectCommand)).toBe(false);
    });
});
