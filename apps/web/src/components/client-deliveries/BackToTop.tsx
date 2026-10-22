'use client';

import { useEffect, useRef, useState } from 'react';
import ArrowIcon from '@/components/atoms/frontend/icons/ArrowIcon';
import { type DeliveryTheme, themeStyle } from '@/lib/client-deliveries/theme';

/** Offers a return control after the cover, revealing it on mobile when the visitor scrolls back up. */
export function BackToTop({ theme }: { theme: DeliveryTheme }) {
    const button = useRef<HTMLButtonElement>(null);
    const [hasPassedCover, setHasPassedCover] = useState(false);
    const [shouldShowForScroll, setShouldShowForScroll] = useState(false);
    const isVisible = hasPassedCover && shouldShowForScroll;

    useEffect(() => {
        const cover = button.current?.closest('.delivery-page')?.querySelector('.delivery-hero');
        if (!cover) return;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry) setHasPassedCover(entry.boundingClientRect.bottom <= 0);
        });
        observer.observe(cover);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const desktop = window.matchMedia('(min-width: 768px)');
        // Clamp Safari's elastic overscroll so bouncing at either end cannot reverse the direction.
        const scrollPosition = () =>
            Math.min(
                Math.max(0, window.scrollY),
                Math.max(0, document.documentElement.scrollHeight - window.innerHeight),
            );
        let previousY = scrollPosition();
        let direction = 0;
        let distance = 0;
        let frame = 0;
        const track = () => {
            if (desktop.matches) return;
            const currentY = scrollPosition();
            const delta = currentY - previousY;
            previousY = currentY;
            if (delta === 0) return;
            const nextDirection = Math.sign(delta);
            distance = nextDirection === direction ? distance + Math.abs(delta) : Math.abs(delta);
            direction = nextDirection;
            // Small finger movements should not make the control flicker between states.
            if (distance >= 12) setShouldShowForScroll(direction < 0);
        };
        const schedule = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(track);
        };
        const reset = () => {
            previousY = scrollPosition();
            direction = 0;
            distance = 0;
            setShouldShowForScroll(desktop.matches);
        };
        reset();
        desktop.addEventListener('change', reset);
        window.addEventListener('scroll', schedule, { passive: true });
        return () => {
            cancelAnimationFrame(frame);
            desktop.removeEventListener('change', reset);
            window.removeEventListener('scroll', schedule);
        };
    }, []);

    return (
        <button
            ref={button}
            type="button"
            aria-label="Til toppen"
            data-visible={isVisible}
            aria-hidden={!isVisible}
            inert={!isVisible}
            tabIndex={isVisible ? 0 : -1}
            style={themeStyle(theme)}
            className="delivery-back-to-top focus-ring-tight fixed z-10 inline-flex size-12 cursor-pointer items-center justify-center rounded-[var(--btn-radius)] border border-current bg-transparent"
            onClick={() => {
                const target = document.getElementById('top');
                if (!target) return;
                const shouldReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                target.focus({ preventScroll: true });
                window.scrollTo({ top: 0, behavior: shouldReduceMotion ? 'instant' : 'smooth' });
            }}
        >
            <ArrowIcon className="-rotate-90" />
        </button>
    );
}
