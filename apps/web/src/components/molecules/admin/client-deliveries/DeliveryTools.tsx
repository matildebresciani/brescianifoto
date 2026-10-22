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
                    <button
                        type="button"
                        onClick={async () => {
                            const result = await ResultAsync.fromPromise(
                                navigator.clipboard.writeText(new URL(url, window.location.origin).toString()),
                                () => 'Copy failed.',
                            );
                            setNotice(
                                result.isOk()
                                    ? 'Gallery link copied.'
                                    : `Could not copy automatically. Gallery link: ${new URL(url, window.location.origin).toString()}`,
                            );
                        }}
                    >
                        Copy client link
                    </button>
                )}
            </div>
            <UploadPanel
                galleryId={id ? String(id) : undefined}
                kind="archive"
                label="Upload gallery ZIP (max. 25 GB)"
                onUploaded={(ids) => {
                    if (ids[0]) {
                        setArchive(ids[0]);
                        setNotice('ZIP uploaded. Save the gallery to attach it.');
                    }
                }}
            />
            {archiveRevision && archiveRevision !== revision ? (
                <p aria-live="polite">ZIP out of date. Replace or confirm it to enable Download all.</p>
            ) : null}
            <div aria-live="polite">{notice && <p>{notice}</p>}</div>
        </section>
    );
}
