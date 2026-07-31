'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Locale } from '@/i18n/localized-collections';
import { getLinkTarget } from '@/lib/utilities/composables';
import { formatLink } from '@/lib/utilities/format-link';
import { cn } from '@/lib/utilities/ui';
import type { Navigation } from '@/payload-types';

type Props = {
    data: Navigation['navItems'] | null;
    locale: Locale;
};

const SecondaryNavigation = ({ data, locale }: Props) => {
    const pathname = usePathname();

    return (
        <nav className="flex justify-center gap-5 py-2 bg-gray-200">
            {data?.map((item, i) => {
                const itemLink = formatLink(item.link, locale);
                if (!itemLink) return null;

                return (
                    <Link
                        key={item.id ?? i}
                        href={itemLink}
                        className={cn('text-xs hover:underline', itemLink === pathname && 'underline')}
                        target={getLinkTarget(item.link)}
                    >
                        {item.link?.label}
                    </Link>
                );
            })}
        </nav>
    );
};

export default SecondaryNavigation;
