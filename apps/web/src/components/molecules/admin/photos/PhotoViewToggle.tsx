'use client';

import { usePreferences } from '@payloadcms/ui';
import { Grid2X2, List } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import './photos.css';

type PhotoView = 'grid' | 'list';

/** Stores the editor's preferred gallery field layout. */
export function usePhotoView(preferenceKey: string) {
    const [view, setView] = useState<PhotoView>('grid');
    const hasChanged = useRef(false);
    const { getPreference, setPreference } = usePreferences();

    useEffect(() => {
        let isActive = true;
        void getPreference<unknown>(preferenceKey).then(
            (savedView) => {
                if (isActive && !hasChanged.current && (savedView === 'grid' || savedView === 'list')) {
                    setView(savedView);
                }
            },
            () => undefined,
        );
        return () => {
            isActive = false;
        };
    }, [getPreference, preferenceKey]);

    const changeView = (nextView: PhotoView) => {
        hasChanged.current = true;
        setView(nextView);
        // A failed preference request must not prevent switching the current layout.
        void setPreference(preferenceKey, nextView).catch(() => undefined);
    };

    return { view, changeView };
}

/** Accessible layout controls for the gallery field. */
export function PhotoViewToggle({
    view,
    onChange,
    label,
}: {
    view: PhotoView;
    onChange: (view: PhotoView) => void;
    label: string;
}) {
    return (
        <fieldset className="photo-view-toggle" aria-label={label}>
            <button type="button" aria-pressed={view === 'grid'} onClick={() => onChange('grid')}>
                <Grid2X2 size={16} aria-hidden="true" />
                Grid
            </button>
            <button type="button" aria-pressed={view === 'list'} onClick={() => onChange('list')}>
                <List size={16} aria-hidden="true" />
                List
            </button>
        </fieldset>
    );
}
