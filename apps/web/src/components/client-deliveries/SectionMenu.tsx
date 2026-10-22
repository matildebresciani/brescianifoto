'use client';

import { useEffect, useRef, useState } from 'react';
import { type DeliveryTheme, formatBytes, themeStyle } from '@/lib/client-deliveries/shared';
import type { DeliveryView } from '@/lib/client-deliveries/view';

export function SectionMenu({
    sections,
    archive,
    theme,
}: {
    sections: { anchor: string; label: string }[];
    archive: DeliveryView['archive'];
    theme: DeliveryTheme;
}) {
    const [active, setActive] = useState(sections[0]?.anchor);
    const nav = useRef<HTMLElement>(null);
    const menu = useRef<HTMLDetailsElement>(null);
    useEffect(() => {
        const element = nav.current;
        if (!element) return;
        const page = element.closest<HTMLElement>('.delivery-page');
        const resize = new ResizeObserver(() =>
            page?.style.setProperty('--delivery-nav-height', `${element.getBoundingClientRect().height}px`),
        );
        resize.observe(element);
        const track = () => {
            const threshold = element.getBoundingClientRect().height + 48;
            const current = [...sections]
                .reverse()
                .find(
                    (section) =>
                        (document.getElementById(section.anchor)?.getBoundingClientRect().top ??
                            Number.POSITIVE_INFINITY) <= threshold,
                );
            if (current) setActive(current.anchor);
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
                if (menu.current) menu.current.open = false;
                requestAnimationFrame(() => document.getElementById(section.anchor)?.focus({ preventScroll: true }));
            }}
        >
            {section.label}
        </a>
    ));
    return (
        <nav
            ref={nav}
            className="delivery-nav border-y border-border-base bg-bg-base text-fg-base"
            style={themeStyle(theme)}
            aria-label="Gallery sections"
        >
            <div className="delivery-nav-desktop">{links}</div>
            <details ref={menu} className="delivery-nav-mobile">
                <summary className="ui-text focus-ring">
                    {sections.find((section) => section.anchor === active)?.label || 'Sections'}{' '}
                    <span aria-hidden="true">⌄</span>
                </summary>
                <div>{links}</div>
            </details>
            {archive && (
                <a className="delivery-primary ui-text focus-ring" href={archive.href}>
                    Download all <span className="metadata">{formatBytes(archive.byteSize)}</span>
                </a>
            )}
        </nav>
    );
}
