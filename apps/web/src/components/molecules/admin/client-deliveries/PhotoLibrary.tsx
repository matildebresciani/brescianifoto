'use client';

import { Button, useConfig, useDocumentInfo, usePayloadAPI } from '@payloadcms/ui';
import type { UIFieldClientProps } from 'payload';
import { useState } from 'react';
import { z } from 'zod';
import { UploadPanel } from './UploadPanel';
import './admin.css';

const photoPageSchema = z.object({
    docs: z.array(
        z.object({
            id: z.string(),
            gallery: z.string(),
            originalFilename: z.string(),
            url: z.string().min(1),
            thumbnailURL: z.string().nullable().optional(),
        }),
    ),
    totalDocs: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
    hasNextPage: z.boolean(),
    hasPrevPage: z.boolean(),
});

function PhotoLibraryPage({
    galleryId,
    page,
    onPageChange,
    onRetry,
}: {
    galleryId: string;
    page: number;
    onPageChange: (page: number) => void;
    onRetry: () => void;
}) {
    const { config } = useConfig();
    const [{ data, isLoading, isError }] = usePayloadAPI(
        `${config.serverURL || ''}${config.routes.api}/client-photos`,
        {
            initialParams: {
                where: { gallery: { equals: galleryId } },
                depth: 0,
                limit: 24,
                page,
                sort: '-createdAt,-id',
            },
        },
    );
    const result = photoPageSchema.safeParse(data);
    if (isLoading) return <p aria-live="polite">Loading uploaded photos…</p>;
    if (isError || !result.success || result.data.docs.some((photo) => photo.gallery !== galleryId)) {
        return (
            <div role="alert">
                <p>Could not load uploaded photos.</p>
                <Button type="button" buttonStyle="secondary" onClick={onRetry}>
                    Retry
                </Button>
            </div>
        );
    }
    const photos = result.data;
    if (!photos.totalDocs) return <p aria-live="polite">No photos uploaded yet.</p>;

    return (
        <div>
            <p aria-live="polite">
                {photos.totalDocs} uploaded {photos.totalDocs === 1 ? 'photo' : 'photos'}
            </p>
            <ul className="delivery-library-grid" aria-label="Uploaded photos">
                {photos.docs.map((photo) => (
                    <li key={photo.id} className="delivery-library-photo">
                        <a
                            href={photo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Open original: ${photo.originalFilename} (new tab)`}
                        >
                            {/* Private thumbnails already have a size-limited rendition and a signed URL. */}
                            {/* biome-ignore lint/performance/noImgElement: Keep private thumbnail signatures intact without proxying through Next's public image cache. */}
                            <img src={photo.thumbnailURL || photo.url} alt={photo.originalFilename} loading="lazy" />
                            <span>{photo.originalFilename}</span>
                        </a>
                    </li>
                ))}
            </ul>
            {photos.totalPages > 1 && (
                <nav className="delivery-library-pagination" aria-label="Photo library pages">
                    <Button
                        type="button"
                        buttonStyle="secondary"
                        disabled={!photos.hasPrevPage}
                        onClick={() => onPageChange(page - 1)}
                    >
                        Previous
                    </Button>
                    <span aria-live="polite">
                        Page {page} of {photos.totalPages}
                    </span>
                    <Button
                        type="button"
                        buttonStyle="secondary"
                        disabled={!photos.hasNextPage}
                        onClick={() => onPageChange(page + 1)}
                    >
                        Next
                    </Button>
                </nav>
            )}
        </div>
    );
}

function SavedPhotoLibrary({ galleryId, isReadOnly }: { galleryId: string; isReadOnly: boolean }) {
    const [revision, setRevision] = useState(0);
    const [page, setPage] = useState(1);

    return (
        <section aria-label="Gallery photo library">
            <UploadPanel
                galleryId={galleryId}
                kind="photo"
                hasMany
                label="Upload photos"
                isDisabled={isReadOnly}
                onUploaded={() => {
                    setPage(1);
                    setRevision((current) => current + 1);
                }}
            />
            <p>JPEG · max. 50 MB per photo</p>
            <PhotoLibraryPage
                key={`${page}-${revision}`}
                galleryId={galleryId}
                page={page}
                onPageChange={setPage}
                onRetry={() => setRevision((current) => current + 1)}
            />
        </section>
    );
}

/** Browse verified uploads inline without storing a second photo list or changing section selections. */
export function PhotoLibrary({ readOnly }: UIFieldClientProps) {
    const { id } = useDocumentInfo();
    if (!id) return <p>Save a draft to enable uploads.</p>;
    return <SavedPhotoLibrary key={id} galleryId={String(id)} isReadOnly={Boolean(readOnly)} />;
}
