'use client';
import type React from 'react';
import Logo from '@/components/atoms/frontend/logo/Logo';
import { Link } from '@/i18n/routing';
import { payloadObject } from '@/lib/utilities/composables';
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
    return (
        <footer className="mt-auto bg-bg-base">
            <div className="base-block flex flex-col gap-base py-md md:flex-row md:items-center md:justify-between md:py-lg">
                <Link href="/" className="logo-link focus-ring w-fit">
                    <Logo className="text-[length:var(--logo-font-size-footer)]" />
                </Link>
                <address className="footer-contact flex flex-col gap-xs not-italic md:flex-row md:flex-wrap md:justify-end md:gap-x-lg">
                    {socialLinks?.map((item) => {
                        const label = item.label || payloadObject(item.platform)?.alt;
                        if (!item.link || !label) return null;
                        return (
                            <a
                                key={item.id ?? item.link}
                                href={item.link}
                                className="focus-ring w-fit underline underline-offset-4"
                            >
                                {label}
                            </a>
                        );
                    })}
                    {companyDetails?.email && (
                        <a
                            href={`mailto:${companyDetails.email}`}
                            className="focus-ring w-fit break-all underline underline-offset-4"
                        >
                            email: {companyDetails.email}
                        </a>
                    )}
                </address>
            </div>
            {hasNav && (
                <div className="base-block grid gap-x-lg gap-y-base pb-base md:grid-cols-3">
                    {footer1 && <Navigation data={footer1} />}
                    {footer2 && <Navigation data={footer2} />}
                    {footer3 && <Navigation data={footer3} />}
                </div>
            )}
            <div className="base-block py-xs">{copyright && <p className="body-xs">{copyright}</p>}</div>
        </footer>
    );
};
