import { Slot } from '@radix-ui/react-slot';
import Link from 'next/link';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utilities/ui';
import { type BaseButtonProps, getTheme } from '../buttons/BaseButton';

export type BaseLinkProps = BaseButtonProps & ComponentProps<typeof Link>;

const BaseLink = ({ theme = 'primary', className, asChild, children, ...rest }: BaseLinkProps) => {
    const Comp = asChild ? Slot : Link;
    return (
        <Comp {...rest} className={cn('btn', getTheme(theme), className)}>
            {children}
        </Comp>
    );
};

export default BaseLink;
