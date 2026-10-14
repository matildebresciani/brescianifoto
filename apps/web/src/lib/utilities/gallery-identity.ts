import { DateTime } from 'luxon';
import { formatSlug } from '@/components/molecules/admin/fields/slug/formatSlug';

/** Identifies a show using its venue and calendar date in the site's time zone. */
export const formatGalleryIdentity = (
    title: string | null | undefined,
    venue: string | null | undefined,
    date: string | null | undefined,
): { name: string; slug: string } => {
    const showDate = date ? DateTime.fromISO(date, { zone: 'Europe/Copenhagen' }) : undefined;
    const parts = [title?.trim(), venue?.trim(), showDate?.isValid ? showDate.toISODate() : undefined].filter(Boolean);
    return { name: parts.join(' · '), slug: formatSlug(parts.join('-')) };
};
