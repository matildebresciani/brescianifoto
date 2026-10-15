import { DateTime } from 'luxon';
import { presentationLanguage } from '@/i18n/presentation';
import type { Gallery } from '@/payload-types';
import { payloadObject } from './composables';
import {
    type GalleryIdentityInput,
    isFestivalGallery,
    isGalleryYear,
    resolveFestivalIdentity,
} from './festival-gallery';

/** Formats valid public dates without changing the locale used to fetch content. */
export const formatPresentationDate = (value: string | null | undefined): string | undefined => {
    if (!value) return undefined;
    const date = DateTime.fromISO(value, { zone: 'Europe/Copenhagen' });
    if (!date.isValid) return undefined;
    return date.setLocale(presentationLanguage).toFormat('d LLL yyyy');
};

/** Formats venue, date and image count for the gallery identity section. */
export const formatGalleryMetadata = (
    gallery: Pick<Gallery, 'location' | 'date' | 'datePrecision' | 'year' | 'gallery'>,
): string => {
    const location = payloadObject(gallery.location);
    const venue = location ? [location.name, location.city].filter((part) => part?.trim()).join(', ') : undefined;
    const count = gallery.gallery.length;
    return [venue, formatGalleryDate(gallery), `${count} ${count === 1 ? 'image' : 'images'}`]
        .filter(Boolean)
        .join(' · ');
};

/** Displays only the precision selected in the editor, even if an older exact date is retained. */
export const formatGalleryDate = (gallery: Pick<Gallery, 'date' | 'datePrecision' | 'year'>): string | undefined => {
    if (gallery.datePrecision === 'year') return isGalleryYear(gallery.year) ? String(gallery.year) : undefined;
    return formatPresentationDate(gallery.date);
};

/** Artist festival credits separate location and year; festival overviews display their edition once. */
export const formatGalleryCardCaption = (gallery: GalleryIdentityInput): string => {
    const date = formatGalleryDate(gallery);
    if (!isFestivalGallery(gallery))
        return [gallery.title, payloadObject(gallery.location)?.name.trim(), date].filter(Boolean).join(' / ');

    const { festival, year, isOverview } = resolveFestivalIdentity(gallery);
    if (isOverview) return [festival, year].filter(Boolean).join(' ');
    return [gallery.title, festival, year].filter(Boolean).join(' / ');
};

/** Keeps artist titles in Archivo and photographic details in the metadata row. */
export const formatGalleryCardDetails = (gallery: Gallery): string => {
    const count = `${gallery.gallery.length} ${gallery.gallery.length === 1 ? 'image' : 'images'}`;
    if (!isFestivalGallery(gallery)) {
        return [payloadObject(gallery.location)?.name, formatGalleryDate(gallery), count].filter(Boolean).join(' · ');
    }
    const { festival, year, isOverview } = resolveFestivalIdentity(gallery);
    return [!isOverview && festival, !isOverview && year, count].filter(Boolean).join(' · ');
};
