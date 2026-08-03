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

const MainNavigation = ({ data, locale }: Props) => {
    const pathname = usePathname();

    return (
        <nav className="flex items-center gap-xl">
            {data?.map((item, i) => {
                const itemLink = formatLink(item.link, locale);
                if (!itemLink) return null;
                const isActive = itemLink === pathname;

                return (
                    <Link
                        key={item.id ?? i}
                        href={itemLink}
                        className={cn(
                            'eyebrow relative py-micro text-fg-base transition-colors after:absolute after:-bottom-1 after:left-0 after:h-px after:bg-fg-highlight after:transition-all after:duration-300 after:content-[""]',
                            isActive
                                ? 'text-fg-highlight after:w-full'
                                : 'after:w-0 hover:text-fg-highlight hover:after:w-full',
                        )}
                        target={getLinkTarget(item.link)}
                    >
                        {item.link?.label}
                    </Link>
                );
            })}
        </nav>
    );
};

export default MainNavigation;
