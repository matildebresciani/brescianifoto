import { RichText } from '@payloadcms/richtext-lexical/react';
import type { BC } from '@/lib/types/block-props';
import type { Hero as HeroProps } from '@/payload-types';
import BaseBlock from '../base-block/BaseBlock';

const HeroBlock: BC<HeroProps> = ({ block }) => {
    const { label, heading, manchet } = block;

    return (
        <BaseBlock>
            <div className="oakgrid">
                <div className="col-span-12">
                    <span>{label}</span>
                    <h1>{heading}</h1>
                    {manchet && <RichText data={manchet} />}
                </div>
            </div>
        </BaseBlock>
    );
};

export default HeroBlock;
