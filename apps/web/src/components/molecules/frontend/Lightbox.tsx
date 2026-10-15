'use client';

import { useEffect } from 'react';
import Close from '@/components/atoms/frontend/buttons/Close';
import ArrowIcon from '@/components/atoms/frontend/icons/ArrowIcon';
import RichText from '@/components/molecules/admin/RichText';
import Portal from '@/components/molecules/Portal';
import { wrapIndex } from '@/lib/utilities/wrap-index';
import type { Media } from '@/payload-types';
import LightboxImage from './LightboxImage';
import LightboxThumbnails from './LightboxThumbnails';
import ModalDialog from './ModalDialog';

type Props = {
    items: Media[];
    index: number;
    onClose: () => void;
    onNavigate: (index: number) => void;
};

const arrowClasses =
    'focus-ring-tight hidden size-12 shrink-0 cursor-pointer items-center justify-center rounded-none border border-border-base bg-bg-subtle text-fg-base transition-colors duration-200 hover:bg-bg-pressed motion-reduce:transition-none md:flex';

const Lightbox = ({ items, index, onClose, onNavigate }: Props) => {
    const current = items[index];

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') onNavigate(wrapIndex(index, -1, items.length));
            if (e.key === 'ArrowRight') onNavigate(wrapIndex(index, 1, items.length));
        };

        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [index, items.length, onNavigate]);

    if (!current) return null;

    return (
        <Portal>
            <ModalDialog
                onClose={onClose}
                aria-label={current.alt || 'Image viewer'}
                className="modal--open fixed inset-0 z-50 flex flex-col bg-bg-base outline-none"
            >
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-base p-base">
                    <p className="caption">
                        {index + 1} / {items.length}
                    </p>
                    <div className="body-sm min-w-0 text-center">
                        {current.caption && (
                            <RichText data={current.caption} enableGutter={false} className="body-sm" />
                        )}
                    </div>
                    <Close onClick={onClose} className="justify-self-end" />
                </div>

                <div className="flex min-h-0 flex-1 items-center gap-xs px-xs">
                    {items.length > 1 && (
                        <button
                            type="button"
                            title="Previous image"
                            aria-label="Previous image"
                            className={arrowClasses}
                            onClick={() => onNavigate(wrapIndex(index, -1, items.length))}
                        >
                            <ArrowIcon descriptive className="rotate-180" />
                        </button>
                    )}

                    <LightboxImage
                        key={`${current.id}:${index}`}
                        image={current}
                        onNavigate={(direction) => onNavigate(wrapIndex(index, direction, items.length))}
                    />

                    {items.length > 1 && (
                        <button
                            type="button"
                            title="Next image"
                            aria-label="Next image"
                            className={arrowClasses}
                            onClick={() => onNavigate(wrapIndex(index, 1, items.length))}
                        >
                            <ArrowIcon descriptive />
                        </button>
                    )}
                </div>

                {items.length > 1 && <LightboxThumbnails items={items} index={index} onNavigate={onNavigate} />}
            </ModalDialog>
        </Portal>
    );
};

export default Lightbox;
