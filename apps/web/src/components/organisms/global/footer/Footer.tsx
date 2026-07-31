import type { Locale } from '@/i18n/localized-collections';
import { getCachedNavigation } from '@/lib/data/payload/get-cached-navigation';
import { FooterClient } from './Footer.client';

export async function Footer({ locale }: { locale: Locale }) {
    const [footer1, footer2, footer3] = await Promise.all([
        getCachedNavigation('position.footer1', locale),
        getCachedNavigation('position.footer2', locale),
        getCachedNavigation('position.footer3', locale),
    ]);

    return <FooterClient footer1={footer1} footer2={footer2} footer3={footer3} />;
}
