'use client';

import { useDocumentInfo, useField, useFormFields } from '@payloadcms/ui';
import { ResultAsync } from 'neverthrow';
import { useState } from 'react';
import { UploadPanel } from './UploadPanel';
import './admin.css';

export function DeliveryTools() {
    const { id } = useDocumentInfo();
    const shareId = useFormFields(([fields]) => fields.shareId?.value);
    const revision = useFormFields(([fields]) => fields.photoRevision?.value);
    const archiveRevision = useFormFields(([fields]) => fields.archiveRevision?.value);
    const { setValue: setArchive } = useField<string>({ path: 'archive' });
    const [notice, setNotice] = useState('');
    const url = typeof shareId === 'string' ? `/deliveries/${shareId}` : undefined;
    return (
        <section className="delivery-admin" aria-label="Delivery tools">
            <div className="delivery-admin-actions">
                <strong>Client delivery</strong>
                {url && (
                    <>
                        <button
                            type="button"
                            onClick={async () => {
                                const result = await ResultAsync.fromPromise(
                                    navigator.clipboard.writeText(new URL(url, window.location.origin).toString()),
                                    () => 'Copy failed.',
                                );
                                setNotice(
                                    result.isOk()
                                        ? 'Gallery link copied. Publish the gallery before sharing.'
                                        : 'Could not copy automatically. Open the gallery and copy its address.',
                                );
                            }}
                        >
                            Copy client link
                        </button>
                        <a href={`${url}?preview=1`} target="_blank" rel="noreferrer">
                            Preview saved draft ↗
                        </a>
                        <a href={url} target="_blank" rel="noreferrer">
                            Open client link ↗
                        </a>
                    </>
                )}
            </div>
            <p>
                Upload photos directly inside each Photo section under Page sections. Save your section changes before
                uploading a matching ZIP.
            </p>
            <UploadPanel
                galleryId={id ? String(id) : undefined}
                kind="archive"
                label="Full gallery ZIP (up to 25 GB)"
                onUploaded={(ids) => {
                    if (ids[0]) {
                        setArchive(ids[0]);
                        setNotice('ZIP uploaded. Save the gallery to attach it.');
                    }
                }}
            />
            {archiveRevision && archiveRevision !== revision ? (
                <p aria-live="polite">
                    The ZIP is out of date. Download all stays hidden until you replace or explicitly confirm it.
                </p>
            ) : null}
            <p aria-live="polite">{notice}</p>
        </section>
    );
}
