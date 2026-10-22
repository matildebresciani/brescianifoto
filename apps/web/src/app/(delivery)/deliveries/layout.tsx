import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { defaultLocale } from '@/i18n/localized-collections';
import { metadataIcons } from '@/lib/data/metadata-icons';
import { formatPageTitle } from '@/lib/data/metadata-title';
import { getCachedOptions } from '@/lib/data/payload/get-cached-options';
import { archivo, ibmPlexMono, instrumentSerif } from '@/lib/styles/fonts';
import '../../(frontend)/globals.css';
import './delivery.css';
import '@/lib/client-deliveries/typography.css';

export async function generateMetadata(): Promise<Metadata> {
    const options = await getCachedOptions(defaultLocale);
    return {
        title: formatPageTitle('Billedgalleri', options.meta),
        icons: metadataIcons,
        robots: { index: false, follow: false, googleBot: { index: false, follow: false, noimageindex: true } },
        referrer: 'no-referrer',
    };
}

export default function DeliveryLayout({ children }: { children: ReactNode }) {
    return (
        <html
            lang="da"
            data-scroll-behavior="smooth"
            className={`${archivo.variable} ${ibmPlexMono.variable} ${instrumentSerif.variable}`}
        >
            <body>{children}</body>
        </html>
    );
}
