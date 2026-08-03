import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { getLinkTarget } from '@/lib/utilities/composables';
import { formatLink } from '@/lib/utilities/format-link';
import { cn } from '@/lib/utilities/ui';
import type { Navigation as NavigationProps } from '@/payload-types';

type Props = {
    data: NavigationProps['navItems'];
};

const Navigation = ({ data }: Props) => {
    const locale = useLocale();
    const pathname = usePathname();

    return (
        <nav>
            <ul className="flex flex-col gap-xs">
                {data?.map((item, i) => {
                    const itemLink = formatLink(item.link, locale);
                    if (!itemLink) return null;
                    const isActive = itemLink === pathname;

                    return (
                        <li key={item.id ?? i}>
                            <Link
                                href={itemLink}
                                className={cn(
                                    'focus-ring body-sm w-fit transition-colors hover:text-fg-base',
                                    isActive && 'text-fg-highlight',
                                )}
                                target={getLinkTarget(item.link)}
                            >
                                {item.link?.label}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
};

export default Navigation;
