import Link from 'next/link';
import type { Locale } from '@/i18n/localized-collections';
import { formatTagLink } from '@/lib/utilities/format-link';
import { cn } from '@/lib/utilities/ui';
import type { Tag as TagType } from '@/payload-types';

type Props = {
    tag: TagType;
    locale: Locale;
    className?: string;
};

const Tag = ({ tag, locale, className }: Props) => {
    const link = formatTagLink(tag.slug, locale);
    if (!link || !tag.tag) return null;

    return (
        <Link
            href={link}
            className={cn(
                'eyebrow focus-ring-tight inline-block cursor-pointer bg-bg-highlight px-xs py-micro text-fg-base transition-colors duration-200 hover:bg-bg-pressed motion-reduce:transition-none',
                className,
            )}
        >
            {tag.tag}
        </Link>
    );
};

export default Tag;
