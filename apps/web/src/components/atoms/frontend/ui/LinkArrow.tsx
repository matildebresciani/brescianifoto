import { cn } from '@/lib/utilities/ui';
import ArrowIcon from '../icons/ArrowIcon';

type Props = {
    className?: string;
    classNameArrow?: string;
};

const LinkArrow = ({ className, classNameArrow }: Props) => {
    return (
        <div
            className={cn(
                'flex items-center justify-center h-[60px] max-w-max aspect-square border border-oak-gray-dark rounded-[25px] transition-colors group-hover:border-oak-carmine-red group-hover:bg-oak-carmine-red',
                className,
            )}
        >
            <ArrowIcon
                className={cn(
                    'rotate-45 transition group-hover:text-oak-alabaster group-hover:rotate-0',
                    classNameArrow,
                )}
            />
        </div>
    );
};

export default LinkArrow;
