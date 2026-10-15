import type { Locale } from '@/i18n/localized-collections';
import { defaultLocale } from '@/i18n/localized-collections';
import type { Gallery, Redirect } from '@/payload-types';
import { getGalleryExactDate, isFestivalGallery, resolveFestivalIdentity } from './festival-gallery';
import { formatLinkByCollection } from './format-link';
import { formatGalleryIdentity } from './gallery-identity';

/** Each snapshot contains actual localized values, with Payload's locale fallback disabled. */
export type FestivalMigrationSnapshot = { locale: Locale; galleries: Gallery[] };

/** One locale's URL change, optionally recovering a missing year-only date for the gallery. */
export type FestivalURLChange = {
    id: string;
    locale: Locale;
    oldSlug?: string | null;
    slug: string;
    recoveredYear?: number;
};

/** A permanent redirect represented as site-relative paths until it is saved. */
export type FestivalURLRedirect = { from: string; to: string; existingId?: string };

/** Preflights all locales together, without writing galleries or overwriting conflicting redirects. */
export const planFestivalURLMigration = (
    snapshots: FestivalMigrationSnapshot[],
    redirects: Redirect[],
    serverURL: string,
) => {
    const changes: FestivalURLChange[] = [];
    const plannedRedirects: FestivalURLRedirect[] = [];
    const errors: string[] = [];
    const defaultGalleries = snapshots.find((snapshot) => snapshot.locale === defaultLocale)?.galleries ?? [];
    const defaults = new Map(defaultGalleries.map((gallery) => [gallery.id, gallery]));
    const owners = new Map<string, string>();
    const proposals = new Map<string, string>();
    const editionYears = new Map<string, number>();

    for (const { locale, galleries } of snapshots) {
        for (const gallery of galleries) {
            const slug = gallery.slug || defaults.get(gallery.id)?.slug;
            const path = formatLinkByCollection(slug, 'galleries', locale);
            if (path) owners.set(path, gallery.id);
        }
    }

    for (const { locale, galleries } of snapshots) {
        for (const stored of galleries) {
            const fallback = defaults.get(stored.id);
            const gallery = { ...stored, title: stored.title?.trim() ? stored.title : fallback?.title };
            if (!isFestivalGallery(gallery)) continue;
            const { festival, year, hasYearConflict } = resolveFestivalIdentity(gallery);
            if (!festival || !year || hasYearConflict || !gallery.title?.trim()) {
                const reason = !festival
                    ? 'missing location'
                    : hasYearConflict
                      ? 'conflicting years'
                      : !year
                        ? 'missing year'
                        : 'missing title';
                errors.push(`${stored.id} (${locale}): ${reason}.`);
                continue;
            }
            const previousYear = editionYears.get(stored.id);
            if (previousYear && previousYear !== year) {
                errors.push(`${stored.id} (${locale}): conflicting years across locales.`);
                continue;
            }
            editionYears.set(stored.id, year);
            const { slug } = formatGalleryIdentity(gallery);
            const oldSlug = stored.slug || fallback?.slug;
            const recoveredYear = !getGalleryExactDate(gallery) && gallery.datePrecision !== 'year' ? year : undefined;
            if (stored.slug === slug && !recoveredYear) continue;
            const from = formatLinkByCollection(oldSlug, 'galleries', locale);
            const to = formatLinkByCollection(slug, 'galleries', locale);
            if (!to) continue;
            const owner = owners.get(to);
            const proposal = proposals.get(to);
            if ((owner && owner !== stored.id) || (proposal && proposal !== stored.id)) {
                errors.push(`${stored.id} (${locale}): URL collision at ${to}.`);
                continue;
            }
            proposals.set(to, stored.id);
            changes.push({ id: stored.id, locale, oldSlug, slug, recoveredYear });
            if (gallery.publishStatus !== 'public' || !from || from === to) continue;

            const matching = redirects.filter((redirect) => redirect.redirectFrom === from);
            const destination = new URL(to, serverURL).toString();
            if (
                matching.length > 1 ||
                matching.some(
                    (redirect) => redirect.active && redirect.redirectTo !== destination && redirect.redirectTo !== to,
                )
            ) {
                errors.push(`${stored.id} (${locale}): conflicting redirect at ${from}.`);
                continue;
            }
            plannedRedirects.push({ from, to, existingId: matching[0]?.id });
        }
    }

    return { changes, redirects: plannedRedirects, errors };
};
