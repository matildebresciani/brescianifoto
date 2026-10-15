import type { FC } from 'react';
import { cn } from '@/lib/utilities/ui';

export type LogoProps = {
    className?: string;
};

const Logo: FC<LogoProps> = ({ className }) => {
    return (
        <span
            className={cn(
                'inline-block max-w-full wrap-anywhere font-primary text-[length:var(--logo-font-size)] leading-none font-black tracking-[var(--logo-letter-spacing)] text-inherit normal-case',
                className,
            )}
        >
            brescianifoto
        </span>
    );
};

export default Logo;
