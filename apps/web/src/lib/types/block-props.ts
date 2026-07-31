import type { FC } from 'react';
import type { Locale } from '@/i18n/localized-collections';

export type BlockProps<T> = {
    block: T;
    locale?: Locale;
    pageId: string;
};

export type BC<T> = FC<BlockProps<T>>;
