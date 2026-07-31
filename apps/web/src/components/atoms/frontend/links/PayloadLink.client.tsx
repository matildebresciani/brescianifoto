'use client';
import { useLocale } from 'next-intl';
import { defaultLocale, isLocale } from '@/i18n/localized-collections';
import PayloadLink, { type PayloadLinkProps } from './PayloadLink';

type Props = Omit<PayloadLinkProps, 'locale'>;

const PayloadLinkClient = (props: Props) => {
    const locale = useLocale();
    const validatedLocale = isLocale(locale) ? locale : defaultLocale;

    return <PayloadLink {...props} locale={validatedLocale} />;
};

export default PayloadLinkClient;
