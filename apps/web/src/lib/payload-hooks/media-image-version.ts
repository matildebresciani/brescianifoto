import { randomUUID } from 'node:crypto';
import type { CollectionBeforeChangeHook, CollectionBeforeOperationHook } from 'payload';
import { z } from 'zod';
import type { Media } from '@/payload-types';

const uploadEditsSchema = z.object({ crop: z.unknown().optional() });

/** Capture explicit uploads before Payload may reread the original to update its focal-point thumbnail. */
export const trackMediaFileUpload: CollectionBeforeOperationHook<'media'> = ({ operation, req }) => {
    if (operation === 'create' || operation === 'update') {
        req.context.hasMediaFileUpload = Boolean(req.file);
    }
};

/** Keep cache versions independent of captions, localization and display-only focal coordinates. */
export const prepareMediaImageVersion: CollectionBeforeChangeHook<Media> = ({ data, originalDoc, operation, req }) => {
    const edits = uploadEditsSchema.safeParse(req.query?.uploadEdits);
    const hasCrop = edits.success && edits.data.crop != null;
    const hasChangedFile = (['filename', 'filesize', 'width', 'height', 'mimeType'] as const).some(
        (key) => data[key] !== undefined && data[key] !== originalDoc?.[key],
    );
    const shouldChangeVersion = operation === 'create' || req.context.hasMediaFileUpload || hasCrop || hasChangedFile;

    return {
        ...data,
        // Pin a legacy record's previous timestamp on its first metadata edit, preserving its current URL.
        imageVersion: shouldChangeVersion ? randomUUID() : originalDoc?.imageVersion || originalDoc?.updatedAt,
    };
};
