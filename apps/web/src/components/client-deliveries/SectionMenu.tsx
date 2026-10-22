'use client';

import { ChevronDown } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useId, useRef, useState } from 'react';
import { type DeliveryTheme, formatBytes, themeStyle } from '@/lib/client-deliveries/shared';
import type { DeliveryView } from '@/lib/client-deliveries/view';

export function SectionMenu({
    sections,
    archive,
    theme,
}: {
    sections: { anchor: string; label: string; theme: DeliveryTheme }[];
    archive: DeliveryView['archive'];
    theme: DeliveryTheme;
}) {
    const [active, setActive] = useState(sections[0]?.anchor);
    const [isOpen, setIsOpen] = useState(false);
    const shouldReduceMotion = useReducedMotion();
    const menuId = useId();
    const nav = useRef<HTMLElement>(null);
    const trigger = useRef<HTMLButtonElement>(null);
    useEffect(() => {
        const element = nav.current;
        if (!element) return;
        const page = element.closest<HTMLElement>('.delivery-page');
        const resize = new ResizeObserver(() =>
            page?.style.setProperty('--delivery-nav-height', `${element.getBoundingClientRect().height}px`),
        );
        resize.observe(element);
        const track = () => {
            const threshold = element.getBoundingClientRect().bottom;
            const current = [...sections]
                .reverse()
                .find(
                    (section) =>
                        (document.getElementById(section.anchor)?.getBoundingClientRect().top ??
                            Number.POSITIVE_INFINITY) <= threshold,
                );
            setActive(current?.anchor ?? sections[0]?.anchor);
        };
        let frame = 0;
        const onScroll = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(track);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        track();
        return () => {
            resize.disconnect();
            cancelAnimationFrame(frame);
            window.removeEventListener('scroll', onScroll);
        };
    }, [sections]);
    const links = sections.map((section) => (
        <a
            key={section.anchor}
            href={`#${section.anchor}`}
            className="focus-ring ui-text"
            aria-current={active === section.anchor ? 'location' : undefined}
            onClick={() => {
                setActive(section.anchor);
                setIsOpen(false);
                requestAnimationFrame(() => document.getElementById(section.anchor)?.focus({ preventScroll: true }));
            }}
        >
            {section.label}
        </a>
    ));
    return (
        <nav
            ref={nav}
            className="delivery-nav bg-bg-base text-fg-base"
            style={themeStyle(sections.find((section) => section.anchor === active)?.theme ?? theme)}
            aria-label="Gallery sections"
        >
            <div className="delivery-nav-desktop">{links}</div>
            <div className="delivery-nav-mobile">
                <button
                    ref={trigger}
                    type="button"
                    className="delivery-nav-toggle ui-text focus-ring"
                    aria-expanded={isOpen}
                    aria-controls={menuId}
                    onClick={() => setIsOpen((previous) => !previous)}
                >
                    {sections.find((section) => section.anchor === active)?.label || 'Sections'}
                    <ChevronDown
                        aria-hidden="true"
                        size={20}
                        strokeWidth={1.5}
                        className={`shrink-0 transition-transform duration-300 motion-reduce:transition-none${isOpen ? ' rotate-180' : ''}`}
                    />
                </button>
                <motion.div
                    id={menuId}
                    className="delivery-nav-panel"
                    initial={false}
                    animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
                    inert={!isOpen}
                    onKeyDown={(event) => {
                        if (event.key !== 'Escape') return;
                        setIsOpen(false);
                        trigger.current?.focus();
                    }}
                >
                    <div className="delivery-nav-links">{links}</div>
                </motion.div>
            </div>
            {archive && (
                <a className="delivery-primary ui-text focus-ring" href={archive.href}>
                    Download all <span className="metadata">{formatBytes(archive.byteSize)}</span>
                </a>
            )}
        </nav>
    );
}
