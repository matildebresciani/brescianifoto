'use client';

import { useDocumentInfo, useFormFields } from '@payloadcms/ui';
import { reduceFieldsToValues } from 'payload/shared';
import { createContext, type ReactNode } from 'react';
import { selectedPhotoIDs } from '@/lib/client-deliveries/shared';

export const SectionPhotoPickerContext = createContext<{ galleryId: string; selectedIDs: string[] } | undefined>(
    undefined,
);

/** Read all current sections, including unsaved edits, while leaving the featured-image field outside the filter. */
export function SectionPhotoPickerProvider({ children }: { children: ReactNode }) {
    const { id } = useDocumentInfo();
    const selectedIDs = useFormFields(([fields]) => {
        const values = reduceFieldsToValues(
            Object.fromEntries(Object.entries(fields).filter(([path]) => path.startsWith('blocks.'))),
            true,
        );
        return selectedPhotoIDs(values.blocks);
    });
    return (
        <SectionPhotoPickerContext.Provider value={id ? { galleryId: String(id), selectedIDs } : undefined}>
            {children}
        </SectionPhotoPickerContext.Provider>
    );
}
