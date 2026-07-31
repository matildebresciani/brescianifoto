'use client';
import Link from 'next/link';
import type React from 'react';
import type { Navigation as NavigationProps } from '@/payload-types';
import BaseBlock from '../../blocks/base-block/BaseBlock';
import Navigation from './components/Navigation';

interface FooterClientProps {
    footer1?: NavigationProps['navItems'] | null;
    footer2?: NavigationProps['navItems'] | null;
    footer3?: NavigationProps['navItems'] | null;
}

export const FooterClient: React.FC<FooterClientProps> = ({ footer1, footer2, footer3 }) => {
    return (
        <footer className="relative mt-auto z-20 bg-gray-200">
            <BaseBlock className="grid gap-5 py-8 md:grid-cols-[1fr_2fr] md:py-8">
                <Link href="/">
                    <span className="heading-4">Logo</span>
                </Link>
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {footer1 && <Navigation data={footer1} />}
                    {footer2 && <Navigation data={footer2} />}
                    {footer3 && <Navigation data={footer3} />}
                </div>
            </BaseBlock>
        </footer>
    );
};
