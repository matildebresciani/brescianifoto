import type { Object as O } from 'ts-toolbelt';
import {
    defaultLocale,
    isLocale,
    isLocalizableCollection,
    type Locale,
    localizedCollections,
    localizedPaths,
    type Path,
    type RoutedCollectionSlug,
} from '@/i18n/localized-collections';
import type { Navigation } from '@/payload-types';

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

export const localizePath = (path: Path, locale: Locale) => {
    return `/${localizedPaths[path][locale]}` as const;
};

export const localizeCollection = (collection: RoutedCollectionSlug, locale: Locale) => {
    if (!isLocalizableCollection(collection)) {
        return '' as const;
    }
    return `/${localizedCollections[collection][locale]}` as const;
};

export const formatLink = (link: O.Path<Navigation, ['navItems', number, 'link']>, locale: string | undefined) => {
    if (!link || !locale) return null;

    const validatedLocale = isLocale(locale) ? locale : defaultLocale;
    const localePath = validatedLocale === defaultLocale ? ('' as const) : (`/${validatedLocale}` as const);

    if (link.type === 'custom' && link.url) {
        if (link.url.startsWith('/')) return `${localePath}${link.url}`;
        return link.url;
    }

    if (typeof link.relation?.value !== 'object' || link.type !== 'reference') {
        return `${localePath}` as const;
    }

    const slug = link.relation.value.slug;
    const slugPath = slug === '/' ? '' : (`/${slug}` as const);
    const collectionPath = localizeCollection(link.relation.relationTo, validatedLocale);
    if (!slug) {
        return `${localePath}${collectionPath}` as const;
    }

    const finalPath = `${localePath}${collectionPath}${slugPath}` as const;
    return finalPath === '' ? ('/' as const) : finalPath;
};

export const formatLinkByCollection = (
    slug?: string | null,
    collection?: RoutedCollectionSlug | null,
    locale?: string | null,
) => {
    if (!slug || !collection || !locale) return null;

    const validatedLocale = isLocale(locale) ? locale : defaultLocale;
    const localePath = validatedLocale === defaultLocale ? ('' as const) : (`/${validatedLocale}` as const);
    const collectionPath = localizeCollection(collection, validatedLocale);
    const slugPath = slug === '/' ? '' : (`/${slug}` as const);

    if (!slug) {
        return `${localePath}` as const;
    }

    const finalPath = `${localePath}${collectionPath}${slugPath}` as const;
    return finalPath === '' ? ('/' as const) : finalPath;
};

type FormatArchiveLinkProps = {
    locale?: string;
    slug?: string;
} & (
    | {
          route: RoutedCollectionSlug;
          type?: 'collection';
      }
    | {
          route: Path;
          type: 'path';
      }
);

export const formatArchiveLink = (props: FormatArchiveLinkProps) => {
    const { locale, slug } = props;
    const validatedLocale = isLocale(locale) ? locale : defaultLocale;

    const localePath = validatedLocale === defaultLocale ? ('' as const) : (`/${validatedLocale}` as const);
    const slugPath = slug === '/' || !slug ? '' : (`/${slug}` as const);

    const routePath =
        props.type === 'path'
            ? localizePath(props.route, validatedLocale)
            : localizeCollection(props.route, validatedLocale);

    const formatted = `${localePath}${routePath}${slugPath}` as const;
    return formatted;
};
