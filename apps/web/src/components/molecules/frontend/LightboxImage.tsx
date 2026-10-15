'use client';

import { type MouseEvent, type PointerEvent, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ImageMedia } from '@/components/atoms/frontend/media/ImageMedia';
import { cssVariables } from '@/cssVariables';
import { cn } from '@/lib/utilities/ui';
import type { Media } from '@/payload-types';

type Props = {
    image: Media;
    onNavigate: (direction: -1 | 1) => void;
};

type Point = { x: number; y: number };
type Gesture = {
    pointerId: number;
    start: Point;
    pan: Point;
    hasMoved: boolean;
};

const desktopQuery = `(min-width: ${cssVariables.breakpoints.md}px) and (any-pointer: fine)`;
const origin: Point = { x: 0, y: 0 };
const zoomScale = 2;
const dragThreshold = 6;
const swipeThreshold = 50;

function subscribeToDesktop(onChange: () => void) {
    const query = window.matchMedia(desktopQuery);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
}

function getIsDesktop() {
    return window.matchMedia(desktopQuery).matches;
}

function getServerIsDesktop() {
    return false;
}

function clampPan(point: Point, limits: Point): Point {
    return {
        x: Math.max(-limits.x, Math.min(limits.x, point.x)),
        y: Math.max(-limits.y, Math.min(limits.y, point.y)),
    };
}

/** Owns the photo's pointer gestures; remount for each photo to reset zoom and pan. */
const LightboxImage = ({ image, onNavigate }: Props) => {
    const viewportRef = useRef<HTMLButtonElement>(null);
    const gestureRef = useRef<Gesture | null>(null);
    const pointersRef = useRef(new Set<number>());
    const shouldSuppressClickRef = useRef(false);
    const pointerTypeRef = useRef('mouse');
    const panLimitsRef = useRef(origin);
    const [isZoomed, setIsZoomed] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [pan, setPan] = useState(origin);
    const canZoom = useSyncExternalStore(subscribeToDesktop, getIsDesktop, getServerIsDesktop);

    useEffect(() => {
        const viewport = viewportRef.current;
        if (!viewport) return;

        const observer = new ResizeObserver(() => {
            setIsZoomed(false);
            setIsDragging(false);
            setPan(origin);
            gestureRef.current = null;
            shouldSuppressClickRef.current = true;
        });
        observer.observe(viewport);
        return () => observer.disconnect();
    }, []);

    const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;

        pointersRef.current.add(event.pointerId);
        pointerTypeRef.current = event.pointerType;
        event.currentTarget.setPointerCapture(event.pointerId);

        // A second finger belongs to the browser's pinch gesture, never photo navigation.
        if (pointersRef.current.size > 1 || !event.isPrimary) {
            gestureRef.current = null;
            shouldSuppressClickRef.current = true;
            setIsDragging(false);
            return;
        }

        shouldSuppressClickRef.current = false;
        gestureRef.current = {
            pointerId: event.pointerId,
            start: { x: event.clientX, y: event.clientY },
            pan,
            hasMoved: false,
        };
    };

    const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
        const gesture = gestureRef.current;
        if (!gesture || gesture.pointerId !== event.pointerId) return;

        const x = event.clientX - gesture.start.x;
        const y = event.clientY - gesture.start.y;
        if (Math.hypot(x, y) > dragThreshold) {
            gesture.hasMoved = true;
            shouldSuppressClickRef.current = true;
        }

        if (!isZoomed || !gesture.hasMoved) return;

        setIsDragging(true);
        setPan(clampPan({ x: gesture.pan.x + x, y: gesture.pan.y + y }, panLimitsRef.current));
    };

    const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
        pointersRef.current.delete(event.pointerId);
        const gesture = gestureRef.current;
        if (!gesture || gesture.pointerId !== event.pointerId) return;

        gestureRef.current = null;
        setIsDragging(false);
        const x = event.clientX - gesture.start.x;
        const y = event.clientY - gesture.start.y;
        if (gesture.hasMoved || Math.hypot(x, y) > dragThreshold) shouldSuppressClickRef.current = true;

        if (isZoomed || Math.abs(x) < swipeThreshold || Math.abs(x) <= Math.abs(y)) return;
        onNavigate(x < 0 ? 1 : -1);
    };

    const handlePointerCancel = (event: PointerEvent<HTMLButtonElement>) => {
        pointersRef.current.delete(event.pointerId);
        if (gestureRef.current?.pointerId !== event.pointerId) return;

        gestureRef.current = null;
        shouldSuppressClickRef.current = true;
        setIsDragging(false);
    };

    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
        const isKeyboardClick = event.detail === 0;
        if (!canZoom || (!isKeyboardClick && pointerTypeRef.current !== 'mouse')) return;
        if (!isKeyboardClick && shouldSuppressClickRef.current) {
            shouldSuppressClickRef.current = false;
            return;
        }

        if (isZoomed) {
            setIsZoomed(false);
            setPan(origin);
            return;
        }

        const photo = event.currentTarget.querySelector('img');
        if (!photo) return;
        const photoRect = photo.getBoundingClientRect();
        const viewportRect = event.currentTarget.getBoundingClientRect();

        // Letterboxing remains draggable, but only a click on the actual photo zooms it.
        if (
            !isKeyboardClick &&
            (event.clientX < photoRect.left ||
                event.clientX > photoRect.right ||
                event.clientY < photoRect.top ||
                event.clientY > photoRect.bottom)
        ) {
            return;
        }

        panLimitsRef.current = {
            x: Math.max(0, (photoRect.width * zoomScale - viewportRect.width) / 2),
            y: Math.max(0, (photoRect.height * zoomScale - viewportRect.height) / 2),
        };
        setPan(
            clampPan(
                isKeyboardClick
                    ? origin
                    : {
                          x: (photoRect.left + photoRect.width / 2 - event.clientX) * (zoomScale - 1),
                          y: (photoRect.top + photoRect.height / 2 - event.clientY) * (zoomScale - 1),
                      },
                panLimitsRef.current,
            ),
        );
        setIsZoomed(true);
    };

    return (
        <button
            ref={viewportRef}
            type="button"
            aria-label={canZoom ? (isZoomed ? 'Zoom out' : 'Zoom in') : 'Photo viewer'}
            aria-pressed={canZoom ? isZoomed : undefined}
            tabIndex={canZoom ? 0 : -1}
            className={cn(
                'focus-ring-tight block h-full min-h-0 min-w-0 flex-1 touch-pan-y touch-pinch-zoom select-none overflow-hidden border-0 bg-transparent p-0',
                canZoom ? (isZoomed ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in') : '',
            )}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onLostPointerCapture={handlePointerCancel}
            onDragStart={(event) => event.preventDefault()}
            onClick={handleClick}
        >
            <span
                className={cn(
                    'pointer-events-none flex h-full w-full items-center justify-center motion-reduce:transition-none',
                    !isDragging && 'transition-transform duration-150 ease-out',
                )}
                style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${isZoomed ? zoomScale : 1})` }}
            >
                <ImageMedia
                    resource={image}
                    className={cn(
                        'h-auto max-h-full w-auto max-w-full object-contain',
                        canZoom && isZoomed && !isDragging && 'pointer-events-auto cursor-zoom-out',
                    )}
                    size={isZoomed ? '200vw' : '100vw'}
                    priority
                />
            </span>
        </button>
    );
};

export default LightboxImage;
