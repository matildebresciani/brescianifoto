import { DateTime } from 'luxon';
import type { Gallery, TagGroup } from '@/payload-types';
import { payloadObject } from './composables';

/** Fields shared by gallery URL generation, card captions and legacy maintenance. */
export type GalleryIdentityInput = Partial<
    Pick<Gallery, 'title' | 'location' | 'date' | 'datePrecision' | 'year' | 'tagGroup' | 'tags'>
>;

/** Reads exact dates in the photographer's calendar, without treating a year as a January show. */
export const getGalleryExactDate = (gallery: Pick<Gallery, 'date' | 'datePrecision'>): DateTime | undefined => {
    if (gallery.datePrecision === 'year' || !gallery.date) return undefined;
    const date = DateTime.fromISO(gallery.date, { zone: 'Europe/Copenhagen' });
    return date.isValid ? date : undefined;
};

/** Year-only values must be four-digit calendar years. */
export const isGalleryYear = (year: unknown): year is number =>
    typeof year === 'number' && Number.isInteger(year) && year >= 1000 && year <= 9999;

const isFestivalGroup = (group: TagGroup | undefined): boolean =>
    [group?.slug, group?.name].some((value) => /^festivals?$/i.test(value?.trim() ?? ''));

/** A saved main group takes precedence over cross-section tags on legacy galleries. */
export const isFestivalGallery = (gallery: Pick<Gallery, 'tagGroup' | 'tags'>): boolean => {
    const group = payloadObject(gallery.tagGroup);
    if (group) return isFestivalGroup(group);
    return Boolean(gallery.tags?.some((tag) => isFestivalGroup(payloadObject(payloadObject(tag)?.tagGroup))));
};

const splitEdition = (value: string | null | undefined): { name: string; year?: number } => {
    const text = value?.trim() ?? '';
    const match = /^(.*?)\s+([1-9]\d{3})$/.exec(text);
    return match ? { name: match[1]?.trim() ?? '', year: Number(match[2]) } : { name: text };
};

/** Resolves a festival exclusively from its location; tags only classify the gallery. */
export const resolveFestivalIdentity = (gallery: GalleryIdentityInput) => {
    const location = splitEdition(payloadObject(gallery.location)?.name);
    const title = splitEdition(gallery.title);
    const isOverview = Boolean(location.name && title.name.toLowerCase() === location.name.toLowerCase());
    const selectedYear =
        gallery.datePrecision === 'year'
            ? isGalleryYear(gallery.year)
                ? gallery.year
                : undefined
            : getGalleryExactDate(gallery)?.year;
    const years = [selectedYear, location.year, isOverview ? title.year : undefined].filter(
        (year) => year !== undefined,
    );
    const hasYearConflict = new Set(years).size > 1;
    // Explicit editor choices win in presentation; maintenance reports conflicting legacy sources before writing.
    const year =
        gallery.datePrecision === 'year' ? selectedYear : (selectedYear ?? (hasYearConflict ? undefined : years[0]));
    return { festival: location.name, year, isOverview, hasYearConflict };
};

/** Sorts by calendar year, then known month/day; year-only entries follow dated shows in the same year. */
export const getGallerySortValue = (gallery: GalleryIdentityInput): number => {
    const date = getGalleryExactDate(gallery);
    if (date) return date.year * 10000 + date.month * 100 + date.day;
    const year =
        gallery.datePrecision === 'year'
            ? gallery.year
            : isFestivalGallery(gallery)
              ? resolveFestivalIdentity(gallery).year
              : undefined;
    return isGalleryYear(year) ? year * 10000 : 0;
};
