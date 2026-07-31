import type { BC } from '@/lib/types/block-props';
import type { Divider as DividerProps } from '@/payload-types';
import BaseBlock from '../base-block/BaseBlock';

const sizeHeights: Record<NonNullable<DividerProps['size']>, string> = {
    small: 'py-6',
    medium: 'py-12',
    large: 'py-18',
} as const;

const DividerBlock: BC<DividerProps> = ({ block }) => {
    const { size, showLine } = block;
    const height = size ? sizeHeights[size] : 'py-8';

    return (
        <BaseBlock classNameOuter={height} className="flex items-center">
            {showLine && <div className="h-0.25 w-full bg-gray-200" />}
        </BaseBlock>
    );
};

export default DividerBlock;
