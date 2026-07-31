type Props = {
    isOpen: boolean;
    onClick: (isOpen: boolean) => void;
};

const BurgerButton = (props: Props) => {
    const { isOpen, onClick } = props;

    return (
        <button
            type="button"
            title="Burger"
            className="relative flex item-center justify-center size-10"
            onClick={() => {
                onClick(!isOpen);
            }}
        >
            <span
                className={`absolute w-5 h-[1px] bg-black transition -translate-x-1/2 ${
                    isOpen ? '-translate-y-0 rotate-45' : '-translate-y-[5px]'
                }`}
            />
            <span
                className={`absolute w-5 h-[1px] bg-black transition -translate-x-1/2 ${
                    isOpen ? 'opacity-0' : 'opacity-100'
                }`}
            />
            <span
                className={`absolute w-5 h-[1px] bg-black transition -translate-x-1/2 ${
                    isOpen ? '-translate-y-0 -rotate-45' : 'translate-y-[5px]'
                }`}
            />
        </button>
    );
};

export default BurgerButton;
