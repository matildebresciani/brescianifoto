import type { PropsWithChildren } from 'react';
import { cn } from '@/lib/utilities/ui';

type Props = PropsWithChildren<{
    className?: string;
    classNameOuter?: string;
}>;

const BaseBlock = ({ className, classNameOuter, children }: Props) => {
    return (
        <section className={cn('base-block-outer', classNameOuter)}>
            <div className={cn('base-block', className)}>{children}</div>
        </section>
    );
};

export default BaseBlock;
