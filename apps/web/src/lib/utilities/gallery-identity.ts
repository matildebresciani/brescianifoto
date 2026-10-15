import { formatSlug } from '@/components/molecules/admin/fields/slug/formatSlug';
import { payloadObject } from './composables';
import {
    type GalleryIdentityInput,
    getGalleryExactDate,
    isFestivalGallery,
    isGalleryYear,
    resolveFestivalIdentity,
} from './festival-gallery';

/** Identifies festivals by location and edition; concerts retain their venue and exact calendar date. */
export const formatGalleryIdentity = (gallery: GalleryIdentityInput): { name: string; slug: string } => {
    if (isFestivalGallery(gallery)) {
        const { festival, year, isOverview } = resolveFestivalIdentity(gallery);
        const parts = [isOverview ? undefined : gallery.title?.trim(), festival, year].filter(Boolean);
        return { name: parts.join(' · '), slug: formatSlug(parts.join('-')) };
    }
    const date =
        gallery.datePrecision === 'year'
            ? isGalleryYear(gallery.year)
                ? gallery.year
                : undefined
            : getGalleryExactDate(gallery)?.toISODate();
    const parts = [gallery.title?.trim(), payloadObject(gallery.location)?.name.trim(), date].filter(Boolean);
    return { name: parts.join(' · '), slug: formatSlug(parts.join('-')) };
};
