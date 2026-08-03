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
        <nav className="flex justify-center gap-md border-b border-border-subtle bg-bg-subtle py-xs">
            {data?.map((item, i) => {
                const itemLink = formatLink(item.link, locale);
                if (!itemLink) return null;
                const isActive = itemLink === pathname;

                return (
                    <Link
                        key={item.id ?? i}
                        href={itemLink}
                        className={cn(
                            'eyebrow transition-colors',
                            isActive ? 'text-fg-highlight' : 'text-fg-subtle hover:text-fg-base',
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

export default SecondaryNavigation;
