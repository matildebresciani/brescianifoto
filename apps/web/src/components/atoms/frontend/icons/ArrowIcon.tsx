type Props = {
    descriptive?: boolean;
    className?: string;
};

const ArrowIcon = ({ descriptive, className }: Props) => {
    return (
        <svg
            role="img"
            aria-label="arrow"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className={className}
            aria-hidden={!descriptive}
        >
            <path
                d="M2 8h12M9 3l5 5-5 5"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default ArrowIcon;
