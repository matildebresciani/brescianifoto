import { createNavigation } from 'next-intl/navigation';
import { defineRouting } from 'next-intl/routing';
import {
    defaultLocale,
    locales,
    localizedCollections,
    localizedPaths,
    paginationTranslations,
} from './localized-collections';

export const routing = defineRouting({
    // A list of all locales that are supported
    locales: locales,

    // Doesn't force a locale prefix when the locale is the default
    localePrefix: 'as-needed',

    // Don't detect the locale from the browser
    localeDetection: false,

    // Used when no locale matches
    defaultLocale: defaultLocale,

    pathnames: {
        '/': '/',

        // Possible routes for Posts collection Archives
        '/posts': {
            en: `/${localizedPaths.posts.en}/`,
            da: `/${localizedPaths.posts.da}/`,
        },
        '/posts/page/[pageNumber]': {
            en: `/${localizedPaths.posts.en}/${paginationTranslations.page.en}/[pageNumber]`,
            da: `/${localizedPaths.posts.da}/${paginationTranslations.page.da}/[pageNumber]`,
        },
        '/posts/[slug]': {
            en: `/${localizedPaths.posts.en}/[slug]`,
            da: `/${localizedPaths.posts.da}/[slug]`,
        },
        '/posts/[slug]/page/[pageNumber]': {
            en: `/${localizedPaths.posts.en}/[slug]/${paginationTranslations.page.en}/[pageNumber]`,
            da: `/${localizedPaths.posts.da}/[slug]/${paginationTranslations.page.da}/[pageNumber]`,
        },

        // Possible routes for Posts collection
        '/post/[slug]': {
            en: `/${localizedCollections.posts.en}/[slug]`,
            da: `/${localizedCollections.posts.da}/[slug]`,
        },
    },
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
