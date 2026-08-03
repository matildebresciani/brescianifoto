import type { CollectionSlug } from 'payload';

export const localizedCollections = {
    'post-categories': {
        en: 'posts',
        da: 'artikler',
    },
    posts: {
        en: 'post',
        da: 'artikel',
    },
    galleries: {
        en: 'gallery',
        da: 'gallery',
    },
} as const;

export const isLocalizableCollection = <const T extends CollectionSlug>(
    collection: T,
): collection is T & keyof typeof localizedCollections => {
    return Object.keys(localizedCollections).includes(collection);
};

/**
 * Contains the paths that are localized but not created as collections in Payload, mainly used by next-intl
 * @example { search: { en: 'search', da: 'sog' } }
 */
export const localizedPaths = {
    posts: {
        en: 'posts',
        da: 'artikler',
    },
} satisfies {
    [path in Path]?: Record<Locale, string>;
};

export const defaultLocale = 'da';
export const locales = ['da', 'en'] as const;
export const nonDefaultLocales = locales.filter((locale) => locale !== defaultLocale);
/**
 * An array of collection slugs that can have their own slug / their own URL.
 */
export const routedCollections = ['pages', 'posts', 'galleries'] as const satisfies readonly CollectionSlug[];
/**
 * All paths that has to be localized but aren't created as collections in Payload
 * @example ['search']
 */
export const paths = ['posts'] as const satisfies readonly string[];

/**
 * The slugs of collections that can have their own slug / their own URL.
 */
export type RoutedCollectionSlug = (typeof routedCollections)[number];
export const isRoutedCollection = (collection: string): collection is RoutedCollectionSlug =>
    // biome-ignore lint: Typecasting is used as a validation tool in this scenario
    routedCollections.includes(collection as RoutedCollectionSlug);

export const paginationTranslations = {
    page: {
        en: 'page',
        da: 'side',
    },
};

export type Path = (typeof paths)[number];

// biome-ignore lint: Typecasting is used as a validation tool in this scenario
export const isLocale = (value?: string): value is Locale => locales.includes(value as Locale);

export type Locale = (typeof locales)[number];
