import type { FC } from 'react';
import { cn } from '@/lib/utilities/ui';

export type LogoProps = {
    className?: string;
};

const Logo: FC<LogoProps> = ({ className }) => {
    return (
        <span
            className={cn(
                'font-primary text-[length:var(--logo-font-size)] leading-none font-black tracking-[var(--logo-letter-spacing)] text-fg-base normal-case',
                className,
            )}
        >
            brescianifoto
        </span>
    );
};

export default Logo;
