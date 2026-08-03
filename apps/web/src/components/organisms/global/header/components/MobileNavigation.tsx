'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Close from '@/components/atoms/frontend/buttons/Close';
import Portal from '@/components/molecules/Portal';
import type { Locale } from '@/i18n/localized-collections';
import { getLinkTarget } from '@/lib/utilities/composables';
import { formatLink } from '@/lib/utilities/format-link';
import { cn } from '@/lib/utilities/ui';
import type { Navigation } from '@/payload-types';
import BurgerButton from '../../../../atoms/frontend/buttons/BurgerButton';

type Props = {
    data: Navigation['navItems'] | null;
    locale: Locale;
};

const MobileNavigation = ({ data, locale }: Props) => {
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        if (isMenuOpen) {
            document.body.classList.add('no-scroll');
        } else {
            document.body.classList.remove('no-scroll');
        }
    }, [isMenuOpen]);

    return (
        <>
            <BurgerButton isOpen={isMenuOpen} onClick={(open) => setIsMenuOpen(open)} />
            <Portal>
                <div
                    id="mobile-navigation"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Menu"
                    inert={!isMenuOpen}
                    className={cn(
                        'dvh-screen fixed top-0 left-0 z-30 flex w-screen flex-col gap-lg border-l border-border-base bg-bg-base p-lg text-fg-base transition',
                        isMenuOpen ? 'translate-x-0' : 'translate-x-full',
                    )}
                >
                    <div className="flex justify-end">
                        <Close onClick={() => setIsMenuOpen(false)} />
                    </div>
                    <nav aria-label="Mobile" className="flex flex-col items-end gap-lg">
                        {data?.map((item, i) => {
                            const itemLink = formatLink(item.link, locale);
                            if (!itemLink) return null;
                            const isActive = itemLink === pathname;

                            return (
                                <Link
                                    key={item.id ?? i}
                                    href={itemLink}
                                    className={cn(
                                        'focus-ring heading-3 transition-colors',
                                        isActive ? 'text-fg-highlight' : 'text-fg-base hover:text-fg-highlight',
                                    )}
                                    target={getLinkTarget(item.link)}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {item.link?.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </Portal>
        </>
    );
};

export default MobileNavigation;
