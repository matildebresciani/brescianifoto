import RichText from '@/components/molecules/admin/RichText';
import type { BC } from '@/lib/types/block-props';
import type { Paragraph as ParagraphProps } from '@/payload-types';
import BaseBlock from '../base-block/BaseBlock';

const ParagraphBlock: BC<ParagraphProps> = ({ block }) => {
    const { richText } = block;

    return (
        <BaseBlock>
            <div className="oakgrid">
                <div className="col-span-12">{richText && <RichText data={richText} enableGutter={false} />}</div>
            </div>
        </BaseBlock>
    );
};

export default ParagraphBlock;
