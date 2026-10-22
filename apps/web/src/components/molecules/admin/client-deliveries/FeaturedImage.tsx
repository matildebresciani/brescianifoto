'use client';

import {
    Button,
    Drawer,
    EditUpload,
    UploadInput,
    useConfig,
    useDocumentInfo,
    useField,
    useModal,
    usePayloadAPI,
} from '@payloadcms/ui';
import type { UploadEdits, UploadFieldClientProps } from 'payload';
import { useState } from 'react';
import { z } from 'zod';
import { relationshipID } from '@/lib/client-deliveries/shared';
import { UploadPanel } from './UploadPanel';

const photoSchema = z.object({ url: z.string(), originalFilename: z.string() });

function FocalPoint({ id, isDisabled }: { id: string; isDisabled: boolean }) {
    const { config } = useConfig();
    const [{ data, isLoading, isError }] = usePayloadAPI(
        `${config.serverURL || ''}${config.routes.api}/client-photos/${encodeURIComponent(id)}`,
        { initialParams: { depth: 0 } },
    );
    const photo = photoSchema.safeParse(data);
    const { value: focalX, setValue: setFocalX } = useField<number>({ path: 'focalX' });
    const { value: focalY, setValue: setFocalY } = useField<number>({ path: 'focalY' });
    const { openModal } = useModal();
    // EditUpload uses this slug internally for both Save and Cancel.
    const slug = 'edit-upload';
    const save = (edits: UploadEdits) => {
        if (isDisabled || !edits.focalPoint) return;
        setFocalX(edits.focalPoint.x);
        setFocalY(edits.focalPoint.y);
    };
    return (
        <>
            <Button
                type="button"
                buttonStyle="secondary"
                size="small"
                disabled={isDisabled || isLoading || !photo.success}
                onClick={() => openModal(slug)}
            >
                Adjust focal point
            </Button>
            {isError && <p role="alert">Could not load the featured image. Reload the gallery to retry.</p>}
            {photo.success && (
                <Drawer slug={slug} title="Featured image focal point">
                    <EditUpload
                        fileName={photo.data.originalFilename}
                        fileSrc={photo.data.url}
                        initialFocalPoint={{ x: focalX ?? 50, y: focalY ?? 50 }}
                        showCrop={false}
                        showFocalPoint
                        onSave={save}
                    />
                </Drawer>
            )}
        </>
    );
}

/** Payload's native single-image picker, with verified transfers and nondestructive framing. */
export function FeaturedImage({ field, path: incomingPath, readOnly, validate }: UploadFieldClientProps) {
    const { config } = useConfig();
    const { id } = useDocumentInfo();
    const { path, value, setValue, disabled, filterOptions, showError } = useField<string | null>({
        potentiallyStalePath: incomingPath,
        validate: (next, options) =>
            validate
                ? validate(next, {
                      ...options,
                      type: 'upload',
                      name: field.name,
                      relationTo: 'client-photos',
                      required: field.required,
                  })
                : true,
    });
    const { setValue: setFocalX } = useField<number>({ path: 'focalX' });
    const { setValue: setFocalY } = useField<number>({ path: 'focalY' });
    const [isUploading, setIsUploading] = useState(false);
    const isDisabled = Boolean(readOnly || disabled);
    const select = (next: unknown) => {
        const nextID = relationshipID(next);
        if (nextID !== relationshipID(value)) {
            setFocalX(50);
            setFocalY(50);
        }
        setValue(nextID ?? null);
    };
    return (
        <UploadInput
            path={path}
            label={field.label}
            required={field.required}
            description={field.admin?.description}
            relationTo="client-photos"
            allowCreate={false}
            api={config.routes.api}
            serverURL={config.serverURL}
            filterOptions={filterOptions}
            value={value ?? undefined}
            showError={showError}
            readOnly={isDisabled || isUploading}
            onChange={select}
            BeforeInput={
                <UploadPanel
                    galleryId={id ? String(id) : undefined}
                    kind="photo"
                    label="Upload featured image"
                    isDisabled={isDisabled}
                    onBusyChange={setIsUploading}
                    onUploaded={(ids) => select(ids[0])}
                />
            }
            AfterInput={
                value ? <FocalPoint key={value} id={value} isDisabled={isDisabled || isUploading} /> : undefined
            }
        />
    );
}
