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
                    className={cn(
                        'dvh-screen fixed top-0 left-0 flex flex-col gap-5 p-5 w-screen bg-white z-30 transition',
                        isMenuOpen ? 'translate-x-0' : 'translate-x-full',
                    )}
                >
                    <div className="flex justify-end">
                        <Close onClick={() => setIsMenuOpen(false)} />
                    </div>
                    <div className="flex flex-col gap-5 items-end">
                        {data?.map((item, i) => {
                            const itemLink = formatLink(item.link, locale);
                            if (!itemLink) return null;

                            return (
                                <Link
                                    key={item.id ?? i}
                                    href={itemLink}
                                    className={cn('text-xl hover:underline', itemLink === pathname && 'underline')}
                                    target={getLinkTarget(item.link)}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {item.link?.label}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </Portal>
        </>
    );
};

export default MobileNavigation;
