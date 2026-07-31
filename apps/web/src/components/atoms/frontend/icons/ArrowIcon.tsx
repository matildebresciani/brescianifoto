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
            height="13"
            viewBox="0 0 16 13"
            fill="none"
            className={className}
            aria-hidden={!descriptive}
        >
            <path
                d="M10 12.5859L8.6 11.1359L12.15 7.58594L0 7.58594L0 5.58594L12.15 5.58594L8.6 2.03594L10 0.585937L16 6.58594L10 12.5859Z"
                fill="currentColor"
            />
        </svg>
    );
};

export default ArrowIcon;
