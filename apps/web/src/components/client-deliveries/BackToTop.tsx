'use client';

import { useEffect, useRef, useState } from 'react';
import ArrowIcon from '@/components/atoms/frontend/icons/ArrowIcon';
import { themeDefaults, themeStyle } from '@/lib/client-deliveries/theme';

/** Keeps the return control available after the gallery cover has left the viewport. */
export function BackToTop() {
    const button = useRef<HTMLButtonElement>(null);
    const [hasPassedCover, setHasPassedCover] = useState(false);

    useEffect(() => {
        const cover = button.current?.closest('.delivery-page')?.querySelector('.delivery-hero');
        if (!cover) return;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry) setHasPassedCover(entry.boundingClientRect.bottom <= 0);
        });
        observer.observe(cover);
        return () => observer.disconnect();
    }, []);

    return (
        <button
            ref={button}
            type="button"
            aria-label="Til toppen"
            hidden={!hasPassedCover}
            style={themeStyle(themeDefaults)}
            className="delivery-back-to-top focus-ring-tight fixed z-10 inline-flex size-12 cursor-pointer items-center justify-center rounded-[var(--btn-radius)] border border-border-base bg-bg-base text-fg-base"
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
