import { cn } from '@/lib/utilities/ui';

type Props = {
    onClick: () => void;
    className?: string;
    label?: string;
};

const Close = ({ onClick, className, label = 'Close' }: Props) => {
    return (
        <button
            type="button"
            title={label}
            aria-label={label}
            className={cn(
                'focus-ring-tight inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-none border-0 bg-transparent p-0 text-fg-base transition-colors duration-200 hover:text-fg-highlight motion-reduce:transition-none',
                className,
            )}
            onClick={() => onClick()}
        >
            <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                aria-hidden="true"
            >
                <path d="m5 5 14 14M19 5 5 19" />
            </svg>
        </button>
    );
};

export default Close;
