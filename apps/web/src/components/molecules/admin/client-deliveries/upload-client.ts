import { err, ok, ResultAsync } from 'neverthrow';
import { z } from 'zod';
import { relationshipID, uploadPartSize } from '@/lib/client-deliveries/shared';

/** Merge with the latest form selection so uploads never overwrite edits made while files were transferring. */
export function mergeUploadedPhotos(current: unknown, uploaded: string[]): string[] {
    const selected = Array.isArray(current) ? current.flatMap((photo) => relationshipID(photo) ?? []) : [];
    return [...new Set([...selected, ...uploaded])];
}

export type UploadJob = {
    id: string;
    file: File;
    kind: 'photo' | 'archive';
    status: 'queued' | 'uploading' | 'done' | 'error' | 'cancelled';
    progress: number;
    message?: string;
    token?: string;
    parts: { PartNumber: number; ETag: string }[];
    controller: AbortController;
};

export async function uploadRequest<T extends z.ZodType>(body: unknown, schema: T) {
    const response = await ResultAsync.fromPromise(
        fetch('/api/client-delivery/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        }),
        () => 'Network error. Retry the file.',
    );
    if (response.isErr()) return err(response.error);
    const json = await ResultAsync.fromPromise(response.value.json(), () => 'The server returned an invalid response.');
    if (json.isErr()) return err(json.error);
    if (!response.value.ok) {
        const error = z.object({ error: z.string() }).safeParse(json.value);
        return err(error.success ? error.data.error : 'The upload failed. Retry the file.');
    }
    const parsed = schema.safeParse(json.value);
    return parsed.success ? ok(parsed.data) : err('The upload response was incomplete. Retry the file.');
}

function sendPart(url: string, blob: Blob, signal: AbortSignal, onProgress: (bytes: number) => void) {
    return ResultAsync.fromPromise(
        new Promise<string>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const abort = () => xhr.abort();
            xhr.open('PUT', url);
            xhr.upload.onprogress = (event) => onProgress(event.loaded);
            xhr.onload = () => {
                const etag = xhr.getResponseHeader('ETag');
                if (xhr.status >= 200 && xhr.status < 300 && etag) resolve(etag);
                else reject(new Error('Part failed. Check R2 CORS allows PUT and exposes ETag.'));
            };
            xhr.onerror = () => reject(new Error('Network error while uploading.'));
            xhr.onabort = () => reject(new Error('Upload cancelled.'));
            xhr.onloadend = () => signal.removeEventListener('abort', abort);
            signal.addEventListener('abort', abort);
            if (signal.aborted) {
                reject(new Error('Upload cancelled.'));
                return;
            }
            xhr.send(blob);
        }),
        (error) => (error instanceof Error ? error.message : 'Part upload failed.'),
    );
}

/** Upload one file in resumable parts; the caller limits concurrent files to three. */
export async function runUpload(job: UploadJob, galleryId: string, update: () => void) {
    job.status = 'uploading';
    job.message = undefined;
    update();
    if (!job.token) {
        const start = await uploadRequest(
            { action: 'start', galleryId, filename: job.file.name, byteSize: job.file.size, kind: job.kind },
            z.object({ token: z.string() }),
        );
        if (start.isErr()) return err(start.error);
        job.token = start.value.token;
    }
    for (let part = job.parts.length + 1; part <= Math.ceil(job.file.size / uploadPartSize); part++) {
        if (job.controller.signal.aborted) return err('Upload cancelled.');
        const signed = await uploadRequest({ action: 'sign', token: job.token, part }, z.object({ url: z.string() }));
        if (signed.isErr()) return err(signed.error);
        const offset = (part - 1) * uploadPartSize;
        const blob = job.file.slice(offset, offset + uploadPartSize);
        const result = await sendPart(signed.value.url, blob, job.controller.signal, (bytes) => {
            job.progress = Math.min(99, Math.floor(((offset + bytes) / job.file.size) * 100));
            update();
        });
        if (result.isErr()) return err(result.error);
        job.parts.push({ PartNumber: part, ETag: result.value });
    }
    if (job.controller.signal.aborted) return err('Upload cancelled.');
    job.message = 'Verifying file…';
    update();
    return uploadRequest({ action: 'complete', token: job.token, parts: job.parts }, z.object({ id: z.string() }));
}
