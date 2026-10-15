import Link from 'next/link';
import ArrowIcon from '../icons/ArrowIcon';

type Props = {
    href: string;
    label: string;
};

/** A quiet return link that keeps its archive destination visible. */
const BackLink = ({ href, label }: Props) => (
    <Link
        href={href}
        aria-label={`Back to ${label}`}
        className="focus-ring group ui-text inline-flex w-fit items-center gap-xs py-xs text-fg-base"
    >
        <ArrowIcon className="rotate-180 transition-transform duration-200 group-hover:-translate-x-micro group-focus-visible:-translate-x-micro motion-reduce:transform-none motion-reduce:transition-none" />
        <span className="underline decoration-transparent underline-offset-4 transition-[text-decoration-color] duration-200 group-hover:decoration-current group-focus-visible:decoration-current motion-reduce:transition-none">
            {label}
        </span>
    </Link>
);

export default BackLink;
