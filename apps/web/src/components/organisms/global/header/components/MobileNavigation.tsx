'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Close from '@/components/atoms/frontend/buttons/Close';
import ModalDialog from '@/components/molecules/frontend/ModalDialog';
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

    return (
        <>
            <BurgerButton isOpen={isMenuOpen} onClick={(open) => setIsMenuOpen(open)} />
            <Portal>
                <ModalDialog
                    id="mobile-navigation"
                    isOpen={isMenuOpen}
                    onClose={() => setIsMenuOpen(false)}
                    aria-label="Menu"
                    className={cn(
                        'dvh-screen fixed top-0 left-0 z-30 flex w-screen flex-col gap-lg border-l border-border-base bg-bg-base p-lg text-fg-base outline-none transition-transform motion-reduce:transition-none',
                        isMenuOpen
                            ? 'translate-x-0 duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]'
                            : 'translate-x-full duration-600 ease-[cubic-bezier(0.65,0,0.35,1)]',
                    )}
                >
                    <div className="flex justify-end">
                        <Close onClick={() => setIsMenuOpen(false)} className="size-10 rounded-none border-0" />
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
                                        'focus-ring eyebrow relative py-micro text-fg-base after:absolute after:-bottom-1 after:left-0 after:h-px after:bg-fg-base after:transition-all after:duration-300 motion-reduce:after:transition-none after:content-[""]',
                                        isActive
                                            ? 'after:w-full'
                                            : 'after:w-0 hover:after:w-full focus-visible:after:w-full',
                                    )}
                                    target={getLinkTarget(item.link)}
                                    aria-current={isActive ? 'page' : undefined}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {item.link?.label}
                                </Link>
                            );
                        })}
                    </nav>
                </ModalDialog>
            </Portal>
        </>
    );
};

export default MobileNavigation;
