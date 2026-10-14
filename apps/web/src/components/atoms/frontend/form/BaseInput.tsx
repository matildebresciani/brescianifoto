import { type ComponentProps, useId } from 'react';
import { cn } from '@/lib/utilities/ui';

type Props = ComponentProps<'input'>;

const BaseInput = ({ id, type = 'text', name, placeholder, ...props }: Props) => {
    const generatedID = useId();
    const internalId = id || generatedID;

    return (
        <div className={cn('relative', props.className)}>
            <input
                id={internalId}
                type={type}
                name={name}
                className={cn('w-full max-w-full border border-black peer', placeholder ? 'px-2 pt-6 pb-2' : 'p-2')}
                placeholder=" "
            />
            {placeholder && (
                <label
                    htmlFor={internalId}
                    className={cn(
                        'ui-text absolute top-2 left-2 right-2 transition-[top]',
                        'peer-focus:top-0.5 peer-[:not(:placeholder-shown)]:top-0.5',
                    )}
                >
                    {placeholder}
                </label>
            )}
        </div>
    );
};

export default BaseInput;
