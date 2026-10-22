'use client';

import { useDocumentInfo } from '@payloadcms/ui';
import type { UIFieldClientProps } from 'payload';
import { useState } from 'react';
import { PhotoBrowser } from './PhotoBrowser';
import { UploadPanel } from './UploadPanel';
import './admin.css';

function SavedPhotoLibrary({ galleryId, isReadOnly }: { galleryId: string; isReadOnly: boolean }) {
    const [revision, setRevision] = useState(0);

    return (
        <section aria-label="Gallery photo library">
            <UploadPanel
                galleryId={galleryId}
                kind="photo"
                hasMany
                label="Upload photos"
                isDisabled={isReadOnly}
                onUploaded={() => {
                    setRevision((current) => current + 1);
                }}
            />
            <p>JPEG · max. 50 MB per photo</p>
            <PhotoBrowser key={revision} galleryId={galleryId} />
        </section>
    );
}

/** Browse verified uploads inline without storing a second photo list or changing section selections. */
export function PhotoLibrary({ readOnly }: UIFieldClientProps) {
    const { id } = useDocumentInfo();
    if (!id) return <p>Save a draft to enable uploads.</p>;
    return <SavedPhotoLibrary key={id} galleryId={String(id)} isReadOnly={Boolean(readOnly)} />;
}
