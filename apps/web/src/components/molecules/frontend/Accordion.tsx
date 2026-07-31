'use client';
import { RichText } from '@payloadcms/richtext-lexical/react';
import type { SerializedEditorState, SerializedLexicalNode } from 'lexical';
import { useId, useState } from 'react';
import { cn } from '@/lib/utilities/ui';

type Props = {
    title: string;
    content: SerializedEditorState<SerializedLexicalNode>;
};

const Accordion = ({ title, content }: Props) => {
    const accordionId = useId();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="w-full bg-oak-cta-bg border border-white/20 rounded-[30px]">
            <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={accordionId}
                className="grid grid-cols-[1fr_3.5rem] items-center gap-5 w-full p-4 text-lg leading-[155%] font-bold text-left cursor-pointer lg:p-6 lg:pr-10 lg:text-xl"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span>{title}</span>
                <div className="relative h-14 w-14 bg-[#323232] rounded-[20px]">
                    <span className="absolute top-1/2 left-1/2 h-[2px] w-[18px] bg-white -translate-y-1/2 -translate-x-1/2" />
                    <span
                        className={cn(
                            'absolute top-1/2 left-1/2 h-[2px] bg-white -translate-y-1/2 -translate-x-1/2 rotate-90 transition-all duration-200',
                            isOpen ? 'w-0' : 'w-[18px]',
                        )}
                    />
                </div>
            </button>
            <div id={accordionId} className={cn('grid transition-all', isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
                <div aria-hidden={!isOpen} className="h-full overflow-hidden">
                    <div className="wysiwyg max-w-[850px] pb-6 px-5 lg:pb-11 lg:px-7">
                        <RichText data={content} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Accordion;
