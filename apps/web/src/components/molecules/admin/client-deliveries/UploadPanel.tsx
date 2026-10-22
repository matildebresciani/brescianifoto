'use client';

import { Button, Dropzone } from '@payloadcms/ui';
import { useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { formatBytes } from '@/lib/client-deliveries/shared';
import { runUpload, type UploadJob, uploadRequest } from './upload-client';
import './admin.css';

type QueueJob = UploadJob & { assetID?: string };

/** Shared resumable uploader; callbacks receive successful IDs in file-selection order. */
export function UploadPanel({
    galleryId,
    kind,
    label,
    isDisabled = false,
    hasMany = false,
    onBusyChange,
    onUploaded,
}: {
    galleryId?: string;
    kind: UploadJob['kind'];
    label: string;
    isDisabled?: boolean;
    hasMany?: boolean;
    onBusyChange?: (isBusy: boolean) => void;
    onUploaded?: (ids: string[]) => void;
}) {
    const fileInput = useRef<HTMLInputElement>(null);
    const jobs = useRef<QueueJob[]>([]);
    const [, render] = useState(0);
    const isMounted = useRef(true);
    const onUploadedRef = useRef(onUploaded);
    useEffect(() => {
        onUploadedRef.current = onUploaded;
    }, [onUploaded]);
    useEffect(() => {
        isMounted.current = true;
        const currentJobs = jobs.current;
        return () => {
            isMounted.current = false;
            for (const job of currentJobs) job.controller.abort();
        };
    }, []);
    const update = () => {
        if (isMounted.current) render((value) => value + 1);
    };
    const isBusy = jobs.current.some((job) => job.status === 'uploading' || job.status === 'queued');
    useEffect(() => {
        onBusyChange?.(isBusy);
        return () => onBusyChange?.(false);
    }, [isBusy, onBusyChange]);
    const notifyCompleted = (batch: QueueJob[]) => {
        if (!isMounted.current) return;
        const ids = batch.flatMap((job) => (job.status === 'done' && job.assetID ? [job.assetID] : []));
        if (ids.length) onUploadedRef.current?.(ids);
    };
    const execute = async (job: QueueJob, shouldRefresh = true) => {
        if (!galleryId || isDisabled) return;
        const result = await runUpload(job, galleryId, update);
        if (job.controller.signal.aborted) {
            job.status = 'cancelled';
        } else if (result.isOk()) {
            job.status = 'done';
            job.progress = 100;
            job.message = undefined;
            job.assetID = result.value.id;
            if (shouldRefresh) notifyCompleted([job]);
        } else {
            job.status = 'error';
            job.message = result.error;
        }
        update();
    };
    const enqueue = async (files: FileList | null) => {
        if (!files || !galleryId || isBusy || isDisabled) return;
        const batch: QueueJob[] = (hasMany ? [...files] : [...files].slice(0, 1)).map((file) => ({
            id: crypto.randomUUID(),
            file,
            kind,
            status: 'queued',
            progress: 0,
            parts: [],
            controller: new AbortController(),
        }));
        const queue = [...batch];
        jobs.current.push(...batch);
        update();
        const worker = async () => {
            for (;;) {
                const job = queue.shift();
                if (!job) return;
                if (job.controller.signal.aborted) {
                    job.status = 'cancelled';
                    update();
                    continue;
                }
                await execute(job, false);
            }
        };
        await Promise.all([worker(), worker(), worker()]);
        notifyCompleted(batch);
    };
    const cancel = async (job: QueueJob) => {
        job.controller.abort();
        job.status = 'cancelled';
        update();
        if (job.token)
            await uploadRequest({ action: 'cancel', token: job.token }, z.object({ cancelled: z.boolean() }));
        job.token = undefined;
        job.parts = [];
    };
    return (
        <div className="delivery-upload-panel">
            <Dropzone
                disabled={!galleryId || isBusy || isDisabled}
                multipleFiles={hasMany}
                onChange={(files) => void enqueue(files)}
            >
                <Button
                    type="button"
                    buttonStyle="pill"
                    disabled={!galleryId || isBusy || isDisabled}
                    onClick={() => fileInput.current?.click()}
                >
                    {label}
                </Button>
                <span> or drag and drop {hasMany ? 'files' : 'a file'} here</span>
                <input
                    ref={fileInput}
                    type="file"
                    hidden
                    aria-label={label}
                    accept={kind === 'photo' ? 'image/jpeg,.jpg,.jpeg' : '.zip,application/zip'}
                    multiple={hasMany}
                    disabled={!galleryId || isBusy || isDisabled}
                    onChange={(event) => {
                        void enqueue(event.target.files);
                        event.target.value = '';
                    }}
                />
            </Dropzone>
            {!galleryId && <p>Save a draft to enable uploads.</p>}
            <ul className="delivery-upload-list">
                {jobs.current.map((job) => (
                    <li key={job.id}>
                        <span>
                            {job.file.name} · {formatBytes(job.file.size)} · {job.status}
                        </span>
                        <progress value={job.progress} max={100} aria-label={`${job.file.name} upload`} />
                        {job.message && <span role={job.status === 'error' ? 'alert' : 'status'}>{job.message}</span>}
                        {job.status === 'error' && (
                            <Button
                                buttonStyle="secondary"
                                size="small"
                                type="button"
                                disabled={isBusy || isDisabled}
                                onClick={() => {
                                    job.controller = new AbortController();
                                    void execute(job);
                                }}
                            >
                                Retry unfinished parts
                            </Button>
                        )}
                        {(job.status === 'error' || job.status === 'cancelled') && (
                            <Button
                                buttonStyle="secondary"
                                size="small"
                                type="button"
                                disabled={isBusy || isDisabled}
                                onClick={async () => {
                                    await cancel(job);
                                    job.controller = new AbortController();
                                    job.progress = 0;
                                    void execute(job);
                                }}
                            >
                                Start again
                            </Button>
                        )}
                        {(job.status === 'uploading' || job.status === 'queued') && (
                            <Button
                                buttonStyle="secondary"
                                size="small"
                                type="button"
                                onClick={() => {
                                    void cancel(job);
                                }}
                            >
                                Cancel
                            </Button>
                        )}
                    </li>
                ))}
            </ul>
            {isBusy && <p>Keep this gallery open until uploads finish.</p>}
        </div>
    );
}
