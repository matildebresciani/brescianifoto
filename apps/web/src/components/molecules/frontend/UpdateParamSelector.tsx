'use client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import ChevronIcon from '@/components/atoms/frontend/icons/ChrevronIcon';
import { cn } from '@/lib/utilities/ui';

type Props = {
    getParam: string;
    defaultValue: string;
    options: ({ value: string; label: string } | undefined)[];
};

const UpdateParamSelector = ({ getParam, defaultValue, options }: Props) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [showOptions, setShowOptions] = useState(false);
    const [selected, setSelected] = useState(options.find((option) => option?.value === defaultValue) ?? options[0]);

    let formattedPathname = pathname;

    const pageNumber = Number(pathname.split('/').pop());
    const isPageNumber = Number.isInteger(pageNumber);

    if (isPageNumber) {
        formattedPathname = `${pathname.slice(0, pathname.lastIndexOf('/'))}/1`;
    }

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set(name, value);

            return params.toString();
        },
        [searchParams],
    );

    const updateOrder = (value: string) => {
        router.replace(`${formattedPathname}?${createQueryString(getParam, value)}`, { scroll: false });
    };

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target;
            if (target instanceof HTMLElement && !target.closest('.param-selector')) {
                setShowOptions(false);
            }
        };

        window.addEventListener('click', handleClick);

        return () => {
            window.removeEventListener('click', handleClick);
        };
    }, []);

    return (
        <div className={cn('relative w-full max-w-[350px]', showOptions ? 'z-[2]' : 'z-[1]')}>
            <button
                type="button"
                className="param-selector relative flex items-center gap-3 w-full py-6 px-5 text-left overflow-hidden z-[2] cursor-pointer"
                onClick={() => setShowOptions(!showOptions)}
            >
                <ChevronIcon
                    className={cn('min-w-6 transition duration-300', showOptions ? 'rotate-180' : 'rotate-0')}
                />
                <span className="sort-filter truncate capitalize">{selected?.label}</span>
            </button>
            <div className="absolute top-0 left-0 w-full pt-[64px] bg-oak-alabaster border border-oak-gray-dark rounded-[24px] overflow-hidden md:pt-[66px]">
                <div
                    className={cn(
                        'grid transition-all duration-300',
                        showOptions ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                    )}
                >
                    <div className="h-full w-full overflow-hidden">
                        <div className="max-h-[300px] w-full overflow-y-auto overflow-x-hidden">
                            <div className="flex flex-col">
                                {options.map((option) => {
                                    if (!option) return null;

                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            className="sort-filter flex items-center gap-3 w-full p-5 text-left cursor-pointer border-oak-gray-dark transition hover:bg-oak-gray-light first:border-t not-last:border-b"
                                            onClick={() => {
                                                setSelected(option);
                                                updateOrder(option?.value ?? '');
                                                setShowOptions(false);
                                            }}
                                        >
                                            <div
                                                className={cn(
                                                    'h-6 w-6 min-w-6 border border-oak-gray-dark rounded-[10px]',
                                                    option?.value === selected?.value && 'bg-oak-gray-dark',
                                                )}
                                            />
                                            <span className="capitalize">{option?.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpdateParamSelector;
