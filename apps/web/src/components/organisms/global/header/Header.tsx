import LogoLink from '@/components/atoms/frontend/logo/Link';
import type { Locale } from '@/i18n/localized-collections';
import { getCachedNavigation } from '@/lib/data/payload/get-cached-navigation';
import MainNavigation from './components/MainNavigation';
import MobileNavigation from './components/MobileNavigation';
import SecondaryNavigation from './components/SecondaryNavigation';

export async function Header({ locale }: { locale: Locale }) {
    const [main, secondary, mobile] = await Promise.all([
        getCachedNavigation('position.main', locale),
        getCachedNavigation('position.secondary', locale),
        getCachedNavigation('position.mobile', locale),
    ]);

    return (
        <header className="sticky top-0 left-0 z-20 w-full border-b border-border-base bg-bg-base/85 backdrop-blur-md">
            {secondary && <SecondaryNavigation data={secondary} locale={locale} />}
            <div className="base-block flex min-h-[var(--header-height)] items-center justify-between gap-5 md:min-h-[var(--header-height-desktop)]">
                <LogoLink />
                <div className="hidden lg:block">{main && <MainNavigation data={main} locale={locale} />}</div>
                <div className="lg:hidden">{mobile && <MobileNavigation data={mobile} locale={locale} />}</div>
            </div>
        </header>
    );
}
