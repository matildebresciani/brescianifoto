'use client';

import { useDocumentInfo, useField, useForm } from '@payloadcms/ui';
import type { UploadFieldClientProps } from 'payload';
import { UploadPanel } from './UploadPanel';
import { mergeUploadedPhotos } from './upload-client';

/** Adds verified direct transfers to Payload's native picker without replacing its selection UI. */
export function PhotoUpload({ path, field, readOnly }: UploadFieldClientProps) {
    const { id } = useDocumentInfo();
    const { getDataByPath } = useForm();
    const { path: currentPath, setValue, disabled } = useField({ potentiallyStalePath: path });
    return (
        <UploadPanel
            galleryId={id ? String(id) : undefined}
            kind="photo"
            label={field.hasMany ? 'Upload photos to this section' : 'Upload a cover photo'}
            isDisabled={readOnly || disabled}
            onUploaded={(ids) =>
                setValue(field.hasMany ? mergeUploadedPhotos(getDataByPath(currentPath), ids) : ids[0])
            }
        />
    );
}
