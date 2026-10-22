'use client';

import { Button, useListDrawerContext, useModal } from '@payloadcms/ui';
import { MediaGallery } from '@sitebytom/payload-media-gallery/client';
import type { ListViewClientProps } from 'payload';
import { useContext } from 'react';
import { PhotoBrowser } from './PhotoBrowser';
import { SectionPhotoPickerContext } from './SectionPhotoPickerContext';

/** Keep Payload's field-specific filtering and bulk insertion while sharing the library's natural filename sort. */
export function ClientPhotoPicker(props: ListViewClientProps) {
    const { isInDrawer, onBulkSelect, drawerSlug } = useListDrawerContext();
    const { closeModal } = useModal();
    const section = useContext(SectionPhotoPickerContext);
    if (isInDrawer && props.enableRowSelections && section && onBulkSelect) {
        return (
            <section className="delivery-photo-picker" aria-label="Choose photos for section">
                <h2>Choose photos for section</h2>
                <p>Photos already used in a photo section are hidden. Select photos, then add them to this section.</p>
                <Button type="button" buttonStyle="secondary" onClick={() => drawerSlug && closeModal(drawerSlug)}>
                    Cancel
                </Button>
                <PhotoBrowser
                    galleryId={section.galleryId}
                    where={{ id: { not_in: section.selectedIDs } }}
                    onChoose={(ids) => onBulkSelect(new Map(ids.map((id) => [id, true])), 'client-photos')}
                />
            </section>
        );
    }
    return (
        <MediaGallery
            {...props}
            defaultView="grid"
            layouts={{ grid: { enabled: true, footer: 'always' }, justified: false, masonry: false }}
            lightbox
            edit={false}
        />
    );
}
