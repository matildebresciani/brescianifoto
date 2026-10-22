'use client';

import { useRowLabel } from '@payloadcms/ui';
import { sectionRowLabel } from './row-labels';
import './admin.css';

/** Payload subscribes the row context to live field values, including selections and rich text. */
export function SectionRowLabel() {
    const { data } = useRowLabel();
    return <span className="delivery-section-label">{sectionRowLabel(data)}</span>;
}
