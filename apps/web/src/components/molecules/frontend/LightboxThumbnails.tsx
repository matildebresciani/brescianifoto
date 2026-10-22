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
    const hasPositionedRef = useRef(false);
    const [isDragging, setIsDragging] = useState(false);

    useLayoutEffect(() => {
        const strip = stripRef.current;
        const active = activeRef.current;
        if (!strip || !active || !items[index]) return;
        // Arrow navigation should not leave the focus marker on a previously clicked thumbnail.
        if (strip.contains(document.activeElement) && document.activeElement !== active) {
            active.focus({ preventScroll: true });
        }

        const followActivePhoto = (behavior: ScrollBehavior = 'instant') => {
            const stripRect = strip.getBoundingClientRect();
            const activeRect = active.getBoundingClientRect();
            // Scroll only the strip so following a photo never moves the viewer or the page behind it.
            strip.scrollTo({
                left: strip.scrollLeft + activeRect.left - stripRect.left - (strip.clientWidth - activeRect.width) / 2,
                behavior,
            });
        };
        const shouldAnimate =
            hasPositionedRef.current && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        followActivePhoto(shouldAnimate ? 'smooth' : 'instant');
        hasPositionedRef.current = true;
        let previousWidth = strip.clientWidth;
        const observer = new ResizeObserver(() => {
            if (strip.clientWidth === previousWidth) return;
            previousWidth = strip.clientWidth;
            followActivePhoto();
        });
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
                        'lightbox-thumbnail focus-ring group relative size-12 shrink-0 cursor-[inherit] overflow-hidden rounded-none border transition-colors duration-200 motion-reduce:transition-none md:size-14',
                        i === index ? 'border-border-highlight' : 'border-border-subtle',
                    )}
                    onClick={() => onNavigate(i)}
                >
                    <ImageMedia
                        resource={item}
                        fill
                        className="object-cover transition-transform duration-300 motion-safe:group-hover:scale-[1.03] motion-safe:group-focus-visible:scale-[1.03] motion-reduce:transition-none"
                        size="56px"
                    />
                </button>
            ))}
        </fieldset>
    );
};

export default LightboxThumbnails;
