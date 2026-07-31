import {
    type Locale,
    type Path,
    paginationTranslations,
    type RoutedCollectionSlug,
} from '@/i18n/localized-collections';
import { formatArchiveLink, formatLinkByCollection } from './format-link';

export const getPageNumber = (slug: string): number => {
    const numberRegex = /\/(\d+)$/;
    const match = slug.match(numberRegex);
    const pageNumber = match ? match[1] : null;
    if (!pageNumber) {
        return 1; // Default to page 1 if no match
    }

    return Number(pageNumber);
};

export type RouteType =
    | {
          slug: string;
          route: RoutedCollectionSlug;
          type?: 'collection';
      }
    | {
          slug?: string;
          route: Path;
          type: 'path';
      };

export const formatPaginationLink = (
    /** The slug of the entry (the slug of the category) */
    newPageNumber: number | null,
    locale: Locale,
    { route, type, slug }: RouteType,
) => {
    const localizedPageSegment = paginationTranslations.page[locale];

    let baseLink = '';

    if (type === 'path') {
        baseLink = formatArchiveLink({ route, locale, type, slug });
    } else {
        const formattedLink = formatLinkByCollection(slug, route, locale);
        if (formattedLink) {
            baseLink = formattedLink;
        }
    }

    if (newPageNumber === null || newPageNumber <= 0) {
        return baseLink;
    }

    return `${baseLink}/${localizedPageSegment}/${newPageNumber}`;
};

export const formatPaginationPrevLink = (currentPageNumber: number, locale: Locale, routeDetails: RouteType) => {
    return formatPaginationLink(currentPageNumber > 1 ? currentPageNumber - 1 : 1, locale, routeDetails);
};

export const formatPaginationNextLink = (currentPageNumber: number, locale: Locale, routeDetails: RouteType) => {
    return formatPaginationLink(currentPageNumber + 1, locale, routeDetails);
};
