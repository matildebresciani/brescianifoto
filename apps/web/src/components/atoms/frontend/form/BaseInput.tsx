import { type ComponentProps, useId } from 'react';
import { cn } from '@/lib/utilities/ui';

type Props = ComponentProps<'input'>;

const BaseInput = ({ id, type = 'text', name, placeholder, ...props }: Props) => {
    const generatedID = useId();
    const internalId = id || generatedID;

    return (
        <div className={cn('relative', props.className)}>
            <input id={internalId} type={type} name={name} className="p-2 border border-black peer" placeholder=" " />
            {placeholder && (
                <label
                    htmlFor={internalId}
                    className={cn(
                        'absolute top-2 left-2 transition-all',
                        'peer-focus:top-0.5 peer-focus:text-[0.55rem]',
                        'peer-[:not(:placeholder-shown)]:top-0.5 peer-[:not(:placeholder-shown)]:text-[0.55rem]',
                    )}
                >
                    {placeholder}
                </label>
            )}
        </div>
    );
};

export default BaseInput;
