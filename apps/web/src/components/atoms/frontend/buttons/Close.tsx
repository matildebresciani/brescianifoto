import { cn } from '@/lib/utilities/ui';

type Props = {
    onClick: () => void;
    className?: string;
};

const Close = ({ onClick, className }: Props) => {
    return (
        <button
            type="button"
            title="Close"
            aria-label="Close"
            className={cn('focus-ring-tight group relative size-10 cursor-pointer', className)}
            onClick={() => onClick()}
        >
            <span className="absolute h-[1px] w-5 bg-fg-base -translate-x-1/2 -translate-y-1/2 rotate-45 transition-colors duration-200 group-hover:bg-fg-highlight" />
            <span className="absolute h-[1px] w-5 bg-fg-base -translate-x-1/2 -translate-y-1/2 -rotate-45 transition-colors duration-200 group-hover:bg-fg-highlight" />
        </button>
    );
};

export default Close;
