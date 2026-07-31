import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/i18n/localized-collections';

export const assertLocale: (locale: string) => asserts locale is Locale = (locale) => {
    if (!isLocale(locale)) {
        notFound();
    }
};
