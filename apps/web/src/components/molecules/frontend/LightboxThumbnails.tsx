'use client';

import { type MouseEvent, type PointerEvent, useLayoutEffect, useRef, useState } from 'react';
import { ImageMedia } from '@/components/atoms/frontend/media/ImageMedia';
import { cn } from '@/lib/utilities/ui';
import type { Media } from '@/payload-types';

type Props = {
    items: Media[];
    index: number;
    onNavigate: (index: number) => void;
};

type DragGesture = {
    pointerId: number;
    startX: number;
    startY: number;
    scrollLeft: number;
    hasDragged: boolean;
};

const dragThreshold = 6;

/** Adds mouse dragging without replacing native touch scrolling or thumbnail clicks. */
const LightboxThumbnails = ({ items, index, onNavigate }: Props) => {
    const stripRef = useRef<HTMLFieldSetElement>(null);
    const activeRef = useRef<HTMLButtonElement>(null);
    const gestureRef = useRef<DragGesture | null>(null);
    const shouldSuppressClickRef = useRef(false);
    const [isDragging, setIsDragging] = useState(false);

    useLayoutEffect(() => {
        const strip = stripRef.current;
        const active = activeRef.current;
        if (!strip || !active || !items[index]) return;

        const followActivePhoto = () => {
            const stripRect = strip.getBoundingClientRect();
            const activeRect = active.getBoundingClientRect();
            // Scroll only the strip so following a photo never moves the viewer or the page behind it.
            strip.scrollTo({
                left: strip.scrollLeft + activeRect.left - stripRect.left - (strip.clientWidth - activeRect.width) / 2,
                behavior: 'instant',
            });
        };
        followActivePhoto();
        const observer = new ResizeObserver(followActivePhoto);
        observer.observe(strip);
        return () => observer.disconnect();
    }, [index, items]);

    const handlePointerDown = (event: PointerEvent<HTMLFieldSetElement>) => {
        if (event.pointerType !== 'mouse' || event.button !== 0 || !event.isPrimary) return;

        shouldSuppressClickRef.current = false;
        if (event.currentTarget.scrollWidth <= event.currentTarget.clientWidth) return;

        gestureRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            scrollLeft: event.currentTarget.scrollLeft,
            hasDragged: false,
        };
    };

    const handlePointerMove = (event: PointerEvent<HTMLFieldSetElement>) => {
        const gesture = gestureRef.current;
        if (!gesture || gesture.pointerId !== event.pointerId) return;
        if ((event.buttons & 1) === 0) {
            gestureRef.current = null;
            setIsDragging(false);
            return;
        }

        const x = event.clientX - gesture.startX;
        const y = event.clientY - gesture.startY;
        if (!gesture.hasDragged) {
            if (Math.abs(x) <= dragThreshold || Math.abs(x) <= Math.abs(y)) return;

            gesture.hasDragged = true;
            shouldSuppressClickRef.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            setIsDragging(true);
        }

        event.preventDefault();
        event.currentTarget.scrollLeft = gesture.scrollLeft - x;
    };

    const handlePointerEnd = (event: PointerEvent<HTMLFieldSetElement>) => {
        const gesture = gestureRef.current;
        if (!gesture || gesture.pointerId !== event.pointerId) return;

        gestureRef.current = null;
        setIsDragging(false);
    };

    const handleClickCapture = (event: MouseEvent<HTMLFieldSetElement>) => {
        // Keyboard activation must still work after a drag or a cancelled pointer gesture.
        if (event.detail === 0 || !shouldSuppressClickRef.current) return;

        shouldSuppressClickRef.current = false;
        event.preventDefault();
        event.stopPropagation();
    };

    return (
        <fieldset
            ref={stripRef}
            aria-label="Photo thumbnails"
            className={cn(
                'flex min-w-0 gap-xs select-none overflow-x-auto scroll-auto! border-0 p-base',
                isDragging ? 'cursor-grabbing' : 'cursor-grab',
            )}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            onLostPointerCapture={handlePointerEnd}
            onDragStart={(event) => event.preventDefault()}
            onClickCapture={handleClickCapture}
        >
            {items.map((item, i) => (
                <button
                    key={item.id}
                    ref={i === index ? activeRef : undefined}
                    type="button"
                    title={item.alt || `Photo ${i + 1}`}
                    aria-label={`Go to photo ${i + 1}`}
                    aria-current={i === index}
                    className={cn(
                        'relative size-12 shrink-0 cursor-[inherit] overflow-hidden rounded-none border transition-colors duration-200 motion-reduce:transition-none md:size-14',
                        i === index ? 'border-border-highlight' : 'border-border-subtle hover:border-border-strong',
                    )}
                    onClick={() => onNavigate(i)}
                >
                    <ImageMedia
                        resource={item}
                        fill
                        className="object-cover transition-opacity duration-200 hover:opacity-80 motion-reduce:transition-none"
                        size="56px"
                    />
                </button>
            ))}
        </fieldset>
    );
};

export default LightboxThumbnails;
