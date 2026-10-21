import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import EndBodyScripts from '@/components/organisms/global/body/EndBodyScripts';
import StartBodyScripts from '@/components/organisms/global/body/StartBodyScripts';
import { Footer } from '@/components/organisms/global/footer/Footer';
import HeadScripts from '@/components/organisms/global/head/HeadScripts';
import { Header } from '@/components/organisms/global/header/Header';
import { presentationLanguage } from '@/i18n/presentation';
import { getDefaultOgImage, metadataIcons } from '@/lib/data/metadata';
import { getCachedOptions } from '@/lib/data/payload/get-cached-options';
import { Providers } from '@/lib/providers/Providers';
import { archivo, ibmPlexMono, instrumentSerif } from '@/lib/styles/fonts';
import { assertLocale } from '@/lib/utilities/assert-locale';
import { getServerSideURL } from '@/lib/utilities/get-url';
import { cn } from '@/lib/utilities/ui';
import '../globals.css';

type Props = LayoutProps<'/[locale]'>;

export default async function RootLayout({ children, params }: Props) {
    const { locale } = await params;

    assertLocale(locale);
    setRequestLocale(locale);

    const options = await getCachedOptions(locale, 1);

    return (
        <html
            data-scroll-behavior="smooth"
            className={cn(archivo.variable, ibmPlexMono.variable, instrumentSerif.variable)}
            lang={presentationLanguage}
            suppressHydrationWarning
        >
            <head>
                <HeadScripts scripts={options.scriptInjection} />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </head>
            <body>
                <StartBodyScripts scripts={options.scriptInjection} />
                <Providers>
                    <a href="#main-content" className="skip-link ui-text">
                        Skip to content
                    </a>
                    <Header locale={locale} />
                    <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
                        {children}
                    </main>
                    <Footer locale={locale} />
                </Providers>
                <EndBodyScripts scripts={options.scriptInjection} />
            </body>
        </html>
    );
}

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
    const meta: Metadata = {};
    const { locale } = await params;

    assertLocale(locale);

    meta.metadataBase = new URL(getServerSideURL());
    meta.icons = metadataIcons;

    const ogImage = await getDefaultOgImage(locale);
    if (ogImage) meta.openGraph = ogImage;

    return meta;
};
