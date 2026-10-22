'use client';

import { Button, FieldLabel, ReactSelect, useConfig, usePayloadAPI } from '@payloadcms/ui';
import { ResultAsync } from 'neverthrow';
import type { Where } from 'payload';
import { useId, useState } from 'react';
import { z } from 'zod';
import { type PhotoLibrarySort, sortLibraryPhotos, togglePhotoSelection } from '@/lib/client-deliveries/photo-library';
import './admin.css';

type PhotoSelection = {
    selectedIDs: string[];
    onToggle: (ids: string[]) => void;
};

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
});

const photoIndexSchema = z.object({
    docs: z.array(
        z.object({
            id: z.string(),
            gallery: z.string(),
            originalFilename: z.string(),
            createdAt: z.string(),
        }),
    ),
    totalDocs: z.number().int().nonnegative(),
});

const sortOptions: { label: string; value: PhotoLibrarySort }[] = [
    { label: 'Filename (A–Z)', value: 'name' },
    { label: 'Filename (Z–A)', value: '-name' },
    { label: 'Newest uploads first', value: 'newest' },
    { label: 'Oldest uploads first', value: 'oldest' },
];

function PhotoLibraryError({ onRetry }: { onRetry: () => void }) {
    return (
        <div role="alert">
            <p>Could not load uploaded photos.</p>
            <Button type="button" buttonStyle="secondary" onClick={onRetry}>
                Retry
            </Button>
        </div>
    );
}

function PhotoLibraryPhotos({
    galleryId,
    ids,
    page,
    totalDocs,
    totalPages,
    onPageChange,
    onRetry,
    selection,
}: {
    galleryId: string;
    ids: string[];
    page: number;
    totalDocs: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onRetry: () => void;
    selection?: PhotoSelection;
}) {
    const { config } = useConfig();
    const [{ data, isLoading, isError }] = usePayloadAPI(
        `${config.serverURL || ''}${config.routes.api}/client-photos`,
        {
            initialParams: {
                where: { and: [{ gallery: { equals: galleryId } }, { id: { in: ids } }] },
                depth: 0,
                limit: 24,
            },
        },
    );
    const result = photoPageSchema.safeParse(data);
    if (isLoading) return <p aria-live="polite">Loading uploaded photos…</p>;
    if (
        isError ||
        !result.success ||
        result.data.docs.length !== ids.length ||
        result.data.docs.some((photo) => photo.gallery !== galleryId || !ids.includes(photo.id))
    ) {
        return <PhotoLibraryError onRetry={onRetry} />;
    }
    const photos = [...result.data.docs].sort((first, second) => ids.indexOf(first.id) - ids.indexOf(second.id));
    const areAllVisibleSelected = selection && ids.every((id) => selection.selectedIDs.includes(id));

    return (
        <div>
            <p aria-live="polite">
                {totalDocs} uploaded {totalDocs === 1 ? 'photo' : 'photos'}
            </p>
            {selection && (
                <Button type="button" buttonStyle="secondary" onClick={() => selection.onToggle(ids)}>
                    {areAllVisibleSelected ? 'Deselect all visible' : 'Select all visible'}
                </Button>
            )}
            <ul className="delivery-library-grid" aria-label="Uploaded photos">
                {photos.map((photo) => (
                    <li
                        key={photo.id}
                        className={`delivery-library-photo${selection ? ' delivery-library-photo--selectable' : ''}`}
                    >
                        {selection && (
                            <label className="delivery-library-select">
                                <input
                                    type="checkbox"
                                    aria-label={`Select ${photo.originalFilename}`}
                                    checked={selection.selectedIDs.includes(photo.id)}
                                    onChange={() => selection.onToggle([photo.id])}
                                />
                                Select photo
                            </label>
                        )}
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
            {totalPages > 1 && (
                <nav className="delivery-library-pagination" aria-label="Photo library pages">
                    <Button
                        type="button"
                        buttonStyle="secondary"
                        disabled={page === 1}
                        onClick={() => onPageChange(page - 1)}
                    >
                        Previous
                    </Button>
                    <span aria-live="polite">
                        Page {page} of {totalPages}
                    </span>
                    <Button
                        type="button"
                        buttonStyle="secondary"
                        disabled={page === totalPages}
                        onClick={() => onPageChange(page + 1)}
                    >
                        Next
                    </Button>
                </nav>
            )}
        </div>
    );
}

function PhotoLibraryListing({
    galleryId,
    sort,
    page,
    onPageChange,
    onRetry,
    where,
    selection,
    onChoose,
}: {
    galleryId: string;
    sort: PhotoLibrarySort;
    page: number;
    onPageChange: (page: number) => void;
    onRetry: () => void;
    where?: Where;
    selection?: PhotoSelection;
    onChoose?: (ids: string[]) => void;
}) {
    const { config } = useConfig();
    const [isAdding, setIsAdding] = useState(false);
    const [addError, setAddError] = useState<string>();
    // Fetch only names and dates for ordering; signed image URLs are requested for the visible page below.
    const [{ data, isLoading, isError }] = usePayloadAPI(
        `${config.serverURL || ''}${config.routes.api}/client-photos`,
        {
            initialParams: {
                where: where
                    ? { and: [{ gallery: { equals: galleryId } }, where] }
                    : { gallery: { equals: galleryId } },
                depth: 0,
                limit: 0,
                pagination: false,
                select: { gallery: true, originalFilename: true, createdAt: true },
            },
        },
    );
    const result = photoIndexSchema.safeParse(data);
    if (isLoading) return <p aria-live="polite">Loading uploaded photos…</p>;
    if (
        isError ||
        !result.success ||
        result.data.docs.length !== result.data.totalDocs ||
        result.data.docs.some((photo) => photo.gallery !== galleryId)
    ) {
        return <PhotoLibraryError onRetry={onRetry} />;
    }
    if (!result.data.totalDocs)
        return (
            <p aria-live="polite">
                {selection ? 'No photos available to add to this section.' : 'No photos uploaded yet.'}
            </p>
        );
    const totalPages = Math.ceil(result.data.totalDocs / 24);
    const currentPage = Math.min(page, totalPages);
    const sorted = sortLibraryPhotos(result.data.docs, sort);
    const ids = sorted.slice((currentPage - 1) * 24, currentPage * 24).map((photo) => photo.id);
    return (
        <>
            <PhotoLibraryPhotos
                key={`${sort}-${currentPage}`}
                galleryId={galleryId}
                ids={ids}
                page={currentPage}
                totalDocs={result.data.totalDocs}
                totalPages={totalPages}
                onPageChange={onPageChange}
                onRetry={onRetry}
                selection={selection}
            />
            {selection && onChoose && (
                <Button
                    type="button"
                    disabled={isAdding || !selection.selectedIDs.length}
                    onClick={async () => {
                        setIsAdding(true);
                        setAddError(undefined);
                        const ids = sorted
                            .filter((photo) => selection.selectedIDs.includes(photo.id))
                            .map((photo) => photo.id);
                        const result = await ResultAsync.fromPromise(
                            Promise.resolve().then(() => onChoose(ids)),
                            () => 'Could not add the selected photos. Please retry.',
                        );
                        if (result.isErr()) setAddError(result.error);
                        setIsAdding(false);
                    }}
                >
                    Add selected photos ({selection.selectedIDs.length})
                </Button>
            )}
            {addError && <p role="alert">{addError}</p>}
        </>
    );
}

/** Shared filename-sorted browser for the upload library and the section selection drawer. */
export function PhotoBrowser({
    galleryId,
    where,
    onChoose,
}: {
    galleryId: string;
    where?: Where;
    onChoose?: (ids: string[]) => void;
}) {
    const [revision, setRevision] = useState(0);
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState<PhotoLibrarySort>('name');
    const [selectedIDs, setSelectedIDs] = useState<string[]>([]);
    const sortId = useId();
    const selection = onChoose
        ? {
              selectedIDs,
              onToggle: (ids: string[]) => setSelectedIDs((current) => togglePhotoSelection(current, ids)),
          }
        : undefined;
    return (
        <>
            <div className="field-type select">
                <FieldLabel htmlFor={sortId} label="Sort photos" />
                <ReactSelect
                    inputId={sortId}
                    options={sortOptions}
                    value={sortOptions.find((item) => item.value === sort)}
                    isClearable={false}
                    onChange={(option) => {
                        if (!option || Array.isArray(option)) return;
                        const selected = sortOptions.find((item) => item.value === option.value);
                        if (!selected) return;
                        setSort(selected.value);
                        setPage(1);
                    }}
                />
            </div>
            <PhotoLibraryListing
                key={revision}
                galleryId={galleryId}
                where={where}
                sort={sort}
                page={page}
                selection={selection}
                onChoose={onChoose}
                onPageChange={setPage}
                onRetry={() => setRevision((current) => current + 1)}
            />
        </>
    );
}
