import type { Locale } from '@/i18n/localized-collections';
import type { PayloadLinkType } from '@/lib/field-templates/links';
import { getLinkTarget } from '@/lib/utilities/composables';
import { formatLink } from '@/lib/utilities/format-link';
import BaseLink, { type BaseLinkProps } from './BaseLink';

export type PayloadLinkProps = Omit<BaseLinkProps, 'href' | 'children'> & {
    link: PayloadLinkType | undefined;
    locale: Locale | undefined;
};

const PayloadLink = ({ link, locale, ...rest }: PayloadLinkProps) => {
    const formattedLink = formatLink(link, locale);
    if (!link || !formattedLink) return null;

    return (
        <BaseLink {...rest} href={formattedLink} target={getLinkTarget(link)}>
            {link.label}
        </BaseLink>
    );
};

export default PayloadLink;
