'use client';

import { UploadField } from '@payloadcms/ui';
import type { UploadFieldClientProps } from 'payload';
import { PhotoViewToggle, usePhotoView } from './PhotoViewToggle';

/** Retains Payload's upload and sortable behavior while making the photographs visible. */
export function GalleryField(props: UploadFieldClientProps) {
    const { view, changeView } = usePhotoView('gallery-photo-view');

    return (
        <div className="photo-gallery-field" data-photo-view={view}>
            <div className="photo-view-toolbar">
                {props.field.relationTo !== 'client-photos' && (
                    <p>Drag the handles to reorder photos. Click a filename to open the original.</p>
                )}
                <PhotoViewToggle view={view} onChange={changeView} label="Gallery photo layout" />
            </div>
            <UploadField {...props} />
        </div>
    );
}
