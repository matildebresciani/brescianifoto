import { DateTime } from 'luxon';
import { presentationLanguage } from '@/i18n/presentation';
import type { Gallery, TagGroup } from '@/payload-types';
import { payloadObject } from './composables';

/** Formats valid public dates without changing the locale used to fetch content. */
export const formatPresentationDate = (value: string | null | undefined): string | undefined => {
    if (!value) return undefined;
    const date = DateTime.fromISO(value, { zone: 'Europe/Copenhagen' });
    if (!date.isValid) return undefined;
    return date.setLocale(presentationLanguage).toFormat('d LLL yyyy');
};

/** Formats venue, date and image count for the gallery identity section. */
export const formatGalleryMetadata = (gallery: Pick<Gallery, 'location' | 'date' | 'gallery'>): string => {
    const location = payloadObject(gallery.location);
    const venue = location ? [location.name, location.city].filter((part) => part?.trim()).join(', ') : undefined;
    const count = gallery.gallery.length;
    return [venue, formatPresentationDate(gallery.date), `${count} ${count === 1 ? 'image' : 'images'}`]
        .filter(Boolean)
        .join(' · ');
};

const isFestivalGroup = (group: TagGroup | undefined): boolean =>
    [group?.slug, group?.name].some((value) => /^festivals?$/i.test(value?.trim() ?? ''));

/** Compact card credit; festival tags may already include their edition year. */
export const formatGalleryCardCaption = (
    gallery: Pick<Gallery, 'title' | 'tagGroup' | 'tags' | 'location' | 'date'>,
): string => {
    const group = payloadObject(gallery.tagGroup);
    const festivalTag = gallery.tags
        ?.map((tag) => payloadObject(tag))
        .find((tag) => tag && isFestivalGroup(payloadObject(tag.tagGroup)));
    // A saved main group takes precedence over cross-section tags. Older galleries can use their festival tag.
    const isFestival = group ? isFestivalGroup(group) : Boolean(festivalTag);
    const date = formatPresentationDate(gallery.date);
    if (!isFestival)
        return [gallery.title, payloadObject(gallery.location)?.name.trim(), date].filter(Boolean).join(' / ');

    const festival =
        festivalTag?.tag?.trim() || festivalTag?.name.trim() || payloadObject(gallery.location)?.name.trim();
    const year = date?.split(' ').at(-1);
    const edition = festival && /\b\d{4}\b/.test(festival) ? festival : [festival, year].filter(Boolean).join(' ');
    return [gallery.title, edition].filter(Boolean).join(' / ');
};
