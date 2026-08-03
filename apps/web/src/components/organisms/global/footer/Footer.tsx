import type { Locale } from '@/i18n/localized-collections';
import { getCachedNavigation } from '@/lib/data/payload/get-cached-navigation';
import { getCachedOptions } from '@/lib/data/payload/get-cached-options';
import { getCachedTranslations } from '@/lib/data/payload/get-cached-translations';
import { FooterClient } from './Footer.client';

export async function Footer({ locale }: { locale: Locale }) {
    const [footer1, footer2, footer3, options, translations] = await Promise.all([
        getCachedNavigation('position.footer1', locale),
        getCachedNavigation('position.footer2', locale),
        getCachedNavigation('position.footer3', locale),
        getCachedOptions(locale, 1),
        getCachedTranslations(locale),
    ]);

    return (
        <FooterClient
            footer1={footer1}
            footer2={footer2}
            footer3={footer3}
            companyDetails={options.companyDetails}
            socialLinks={options.socialLinks}
            copyright={translations.general?.footer?.tlCopyright}
        />
    );
}
