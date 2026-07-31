import Link from 'next/link';
import { Fragment } from 'react';
import ChevronIcon from '@/components/atoms/frontend/icons/ChrevronIcon';
import BaseBlock from '@/components/organisms/blocks/base-block/BaseBlock';
import type { Locale } from '@/i18n/localized-collections';
import { buildQueryString } from '@/lib/utilities/format-search-params';
import {
    formatPaginationLink,
    formatPaginationNextLink,
    formatPaginationPrevLink,
    type RouteType,
} from '@/lib/utilities/get-page-number';
import { cn } from '@/lib/utilities/ui';

type Props = {
    totalPages: number;
    pageNumber: number;
    locale: Locale;
    searchParams?: { [key: string]: string | string[] | undefined };
    className?: string;
    routeDetails: RouteType;
};

const NUMBERS_AROUND_CURRENT_PAGE = 2;

const Pagination = ({ totalPages, pageNumber, locale, searchParams, routeDetails, className }: Props) => {
    let pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    const formattedSearchParams = buildQueryString(searchParams);

    if (totalPages > 5) {
        pages = [
            ...pages.slice(0, 1),
            ...pages.slice(-1),
            ...pages.slice(
                Math.max(pageNumber - NUMBERS_AROUND_CURRENT_PAGE - 1, 0),
                pageNumber + NUMBERS_AROUND_CURRENT_PAGE,
            ),
        ];

        // if (pageNumber > 1) entries.push(pageNumber - 1);
        // if (pageNumber < posts.totalPages) pages.push(pageNumber + 1);

        pages = Array.from(new Set(pages)).sort((a, b) => a - b);
    }

    return (
        <>
            {totalPages > 1 && (
                <BaseBlock className={cn(className)}>
                    <div className="flex justify-center items-center flex-wrap gap-2">
                        <Link
                            href={`${formatPaginationPrevLink(pageNumber, locale, routeDetails)}${formattedSearchParams ? `${formattedSearchParams}` : ''}`}
                            className={cn(
                                'flex items-center justify-center size-8 bg-bh-green rounded-full',
                                pageNumber <= 1 && 'opacity-0 pointer-events-none',
                            )}
                        >
                            <ChevronIcon className="text-white size-4 -scale-x-100" />
                        </Link>
                        {pages.map((page, index) => {
                            const nextPageNumber = pages[index + 1];

                            return (
                                <Fragment key={page}>
                                    <Link
                                        href={`${formatPaginationLink(page, locale, routeDetails)}${formattedSearchParams ? `${formattedSearchParams}` : ''}`}
                                        className={cn(
                                            'paragraph flex items-center justify-center',
                                            pageNumber === page ? 'text-black' : 'text-black/50 hover:text-black',
                                        )}
                                    >
                                        {page}
                                    </Link>
                                    {nextPageNumber && nextPageNumber - page > 1 && (
                                        <div className="flex items-center font-semibold text-black/50">...</div>
                                    )}
                                </Fragment>
                            );
                        })}
                        <Link
                            href={`${formatPaginationNextLink(pageNumber, locale, routeDetails)}${formattedSearchParams ? `${formattedSearchParams}` : ''}`}
                            className={cn(
                                'flex items-center justify-center size-8 bg-bh-green rounded-full',
                                totalPages <= pageNumber && 'opacity-0 pointer-events-none',
                            )}
                        >
                            <ChevronIcon className="text-white size-4" />
                        </Link>
                    </div>
                </BaseBlock>
            )}
        </>
    );
};

export default Pagination;
