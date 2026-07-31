type Props = {
    descriptive?: boolean;
    className?: string;
};

const ChevronIcon = ({ descriptive, className }: Props) => {
    return (
        <svg
            role="img"
            aria-label="chevron"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-hidden={!descriptive}
        >
            <path d="M9 16L14 11.5L9 7" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
        </svg>
    );
};

export default ChevronIcon;
