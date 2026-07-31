import { Slot } from '@radix-ui/react-slot';
import type { ComponentProps, ReactNode } from 'react';
import type { Equals } from 'ts-toolbelt/out/Any/Equals';
import type { Assert } from '@/lib/types/utilities';
import { cn } from '@/lib/utilities/ui';

export type BaseButtonProps = {
    theme?: 'primary' | 'secondary';
    className?: string;
    asChild?: boolean;
    children: ReactNode;
};

type Props = ComponentProps<'button'> & BaseButtonProps;

export const getTheme = (theme: NonNullable<BaseButtonProps['theme']>) => {
    switch (theme) {
        case 'primary':
            return 'btn-primary';
        case 'secondary':
            return 'btn-secondary';
        default: {
            type _ExhaustiveCheck = Assert<Equals<typeof theme, never>>;
            return 'btn-primary';
        }
    }
};

const BaseButton = ({ theme = 'primary', className, asChild, children, ...rest }: Props) => {
    const Comp = asChild ? Slot : 'button';
    return (
        <Comp {...rest} className={cn('btn', getTheme(theme), className)}>
            {children}
        </Comp>
    );
};

export default BaseButton;
