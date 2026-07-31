import { getRequestConfig } from 'next-intl/server';
import { isLocale } from './localized-collections';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
    // This typically corresponds to the `[locale]` segment
    let locale = await requestLocale;

    // Ensure that a valid locale is used
    if (!locale || !isLocale(locale)) {
        locale = routing.defaultLocale;
    }

    return {
        locale,
        messages: (await import(`../lib/messages/${locale}.json`)).default,
    };
});
