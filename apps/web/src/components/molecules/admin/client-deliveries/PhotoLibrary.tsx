'use client';

import { Button, useConfig, useDocumentInfo, useListDrawer, usePayloadAPI } from '@payloadcms/ui';
import type { UIFieldClientProps } from 'payload';
import { useMemo, useState } from 'react';
import { z } from 'zod';
import { UploadPanel } from './UploadPanel';

const countSchema = z.object({ totalDocs: z.number().int().nonnegative() });

function PhotoCount({ galleryId }: { galleryId: string }) {
    const { config } = useConfig();
    const [{ data, isLoading, isError }] = usePayloadAPI(
        `${config.serverURL || ''}${config.routes.api}/client-photos/count`,
        { initialParams: { where: { gallery: { equals: galleryId } } } },
    );
    const count = countSchema.safeParse(data);
    if (isLoading) return <p aria-live="polite">Counting uploaded photos…</p>;
    if (isError || !count.success)
        return <p role="alert">Could not load the photo count. Open the browser to retry.</p>;
    return (
        <p aria-live="polite">
            {count.data.totalDocs} uploaded {count.data.totalDocs === 1 ? 'photo' : 'photos'}
        </p>
    );
}

function SavedPhotoLibrary({ galleryId, isReadOnly }: { galleryId: string; isReadOnly: boolean }) {
    const [revision, setRevision] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const filterOptions = useMemo(() => ({ 'client-photos': { gallery: { equals: galleryId } } }), [galleryId]);
    const [ListDrawer, , { openDrawer, isDrawerOpen }] = useListDrawer({
        collectionSlugs: ['client-photos'],
        filterOptions,
    });

    return (
        <section aria-label="Gallery photo library">
            <UploadPanel
                galleryId={galleryId}
                kind="photo"
                hasMany
                label="Upload photos"
                isDisabled={isReadOnly}
                onBusyChange={setIsUploading}
                onUploaded={() => setRevision((current) => current + 1)}
            />
            <PhotoCount key={revision} galleryId={galleryId} />
            <Button
                type="button"
                buttonStyle="secondary"
                disabled={isUploading}
                onClick={() => {
                    setRevision((current) => current + 1);
                    openDrawer();
                }}
            >
                Browse all photos
            </Button>
            <p>JPEG · max. 50 MB per photo</p>
            {/* Mount on open so completed uploads and current filters are always queried afresh. */}
            {isDrawerOpen && <ListDrawer allowCreate={false} enableRowSelections={false} disableQueryPresets />}
        </section>
    );
}

/** Browse all verified uploads without storing a second photo list or changing section selections. */
export function PhotoLibrary({ readOnly }: UIFieldClientProps) {
    const { id } = useDocumentInfo();
    if (!id) return <p>Save a draft to enable uploads.</p>;
    return <SavedPhotoLibrary key={id} galleryId={String(id)} isReadOnly={Boolean(readOnly)} />;
}
