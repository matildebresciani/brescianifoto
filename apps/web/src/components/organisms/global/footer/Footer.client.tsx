'use client';
import Image from 'next/image';
import type React from 'react';
import ArrowIcon from '@/components/atoms/frontend/icons/ArrowIcon';
import Logo from '@/components/atoms/frontend/logo/Logo';
import { Link } from '@/i18n/routing';
import { payloadObject } from '@/lib/utilities/composables';
import { getMediaUrl } from '@/lib/utilities/get-media-url';
import { cn } from '@/lib/utilities/ui';
import type { Navigation as NavigationProps, Option } from '@/payload-types';
import Navigation from './components/Navigation';

interface FooterClientProps {
    footer1?: NavigationProps['navItems'] | null;
    footer2?: NavigationProps['navItems'] | null;
    footer3?: NavigationProps['navItems'] | null;
    companyDetails?: Option['companyDetails'];
    socialLinks?: Option['socialLinks'];
    copyright?: string | null;
}

export const FooterClient: React.FC<FooterClientProps> = ({
    footer1,
    footer2,
    footer3,
    companyDetails,
    socialLinks,
    copyright,
}) => {
    const hasNav = Boolean(footer1?.length || footer2?.length || footer3?.length);
    const hasContact = Boolean(companyDetails?.address || companyDetails?.email || companyDetails?.phone);
    const location = [companyDetails?.address, companyDetails?.city].filter(Boolean).join(', ');

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <footer className="relative z-20 mt-auto border-t border-border-base bg-bg-base">
            <div className="base-block grid gap-2xl py-section md:grid-cols-12 md:gap-xl">
                <div className={cn('flex flex-col gap-lg', hasNav ? 'md:col-span-5 lg:col-span-4' : 'md:col-span-12')}>
                    <Link href="/" className="focus-ring w-fit opacity-100 transition-opacity hover:opacity-70">
                        <Logo className="text-2xl md:text-3xl" />
                    </Link>

                    {hasContact && (
                        <address className="caption flex w-fit flex-col gap-micro not-italic">
                            {location && <span>{location}</span>}
                            {companyDetails?.email && (
                                <a
                                    href={`mailto:${companyDetails.email}`}
                                    className="focus-ring w-fit transition-colors hover:text-fg-base"
                                >
                                    {companyDetails.email}
                                </a>
                            )}
                            {companyDetails?.phone && (
                                <a
                                    href={`tel:${companyDetails.phone}`}
                                    className="focus-ring w-fit transition-colors hover:text-fg-base"
                                >
                                    {companyDetails.phone}
                                </a>
                            )}
                        </address>
                    )}
                </div>

                {hasNav && (
                    <div className="grid gap-lg sm:grid-cols-2 md:col-span-7 md:gap-xl lg:col-span-8 lg:grid-cols-3">
                        {footer1 && <Navigation data={footer1} />}
                        {footer2 && <Navigation data={footer2} />}
                        {footer3 && <Navigation data={footer3} />}
                    </div>
                )}
            </div>

            <div className="border-t border-border-subtle">
                <div className="base-block flex flex-col items-start gap-base py-lg md:flex-row md:items-center md:justify-between">
                    {copyright && <p className="caption">{copyright}</p>}

                    <div className="flex items-center gap-lg">
                        {socialLinks && socialLinks.length > 0 && (
                            <ul className="flex items-center gap-md">
                                {socialLinks.map((item) => {
                                    const icon = payloadObject(item.platform);
                                    if (!item.link || !icon?.url) return null;

                                    return (
                                        <li key={item.id ?? item.link}>
                                            <a
                                                href={item.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                aria-label={icon.alt || undefined}
                                                className="focus-ring block opacity-80 transition-opacity hover:opacity-100"
                                            >
                                                <Image
                                                    src={getMediaUrl(icon.url, icon.updatedAt)}
                                                    alt={icon.alt || ''}
                                                    width={16}
                                                    height={16}
                                                    className="size-4"
                                                />
                                            </a>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}

                        <button
                            type="button"
                            title="Scroll to top"
                            aria-label="Scroll to top"
                            onClick={scrollToTop}
                            className="focus-ring flex size-4 items-center justify-center text-fg-subtle transition-colors hover:text-fg-base"
                        >
                            <ArrowIcon className="size-3 -rotate-90" />
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    );
};
