import type { FC } from 'react';
import { cn } from '@/lib/utilities/ui';

export type LogoProps = {
    className?: string;
};

const Logo: FC<LogoProps> = ({ className }) => {
    return (
        <span
            className={cn(
                'font-primary text-base font-black tracking-tight text-fg-base uppercase md:text-lg',
                className,
            )}
        >
            Brescianifoto
        </span>
    );
};

export default Logo;
