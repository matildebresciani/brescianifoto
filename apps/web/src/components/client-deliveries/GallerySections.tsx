'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';
import { type DeliveryTheme, themeStyle } from '@/lib/client-deliveries/shared';
import type { DeliveryView } from '@/lib/client-deliveries/view';
import { SectionMenu } from './SectionMenu';

type SectionTheme = { anchor: string; theme: DeliveryTheme };

/** Shares the active section's colors between the menu, content and footer as the gallery scrolls. */
export function GallerySections({
    sections,
    blocks,
    theme,
    archive,
    children,
    footer,
}: {
    sections: (SectionTheme & { label: string })[];
    blocks: SectionTheme[];
    theme: DeliveryTheme;
    archive: DeliveryView['archive'];
    children: ReactNode;
    footer: ReactNode;
}) {
    const root = useRef<HTMLDivElement>(null);
    const [active, setActive] = useState({ block: blocks[0]?.anchor, photo: sections[0]?.anchor });
    const activeTheme = blocks.find((block) => block.anchor === active.block)?.theme ?? theme;

    useEffect(() => {
        const element = root.current;
        const nav = element?.querySelector('nav');
        if (!element || !nav) return;
        const page = element.closest<HTMLElement>('.delivery-page');
        const track = () => {
            const threshold = nav.getBoundingClientRect().bottom;
            // A short final section cannot reach the bar once the document has reached its end.
            const isAtEnd =
                window.scrollY > 0 && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 1;
            const current = (items: SectionTheme[]) =>
                isAtEnd
                    ? items.at(-1)
                    : [...items].reverse().find((item) => {
                          const target = document.getElementById(item.anchor);
                          if (!target) return false;
                          const scrollMargin = Number.parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
                          return target.getBoundingClientRect().top <= Math.max(threshold, scrollMargin) + 1;
                      });
            const block = current(blocks)?.anchor ?? blocks[0]?.anchor;
            const photo = current(sections)?.anchor ?? sections[0]?.anchor;
            setActive((previous) =>
                previous.block === block && previous.photo === photo ? previous : { block, photo },
            );
        };
        const resize = new ResizeObserver(() => {
            page?.style.setProperty('--delivery-nav-height', `${nav.getBoundingClientRect().height}px`);
            track();
        });
        resize.observe(nav);
        let frame = 0;
        const schedule = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(track);
        };
        window.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', schedule);
        track();
        return () => {
            resize.disconnect();
            cancelAnimationFrame(frame);
            window.removeEventListener('scroll', schedule);
            window.removeEventListener('resize', schedule);
        };
    }, [blocks, sections]);

    return (
        <div ref={root} className="delivery-sections bg-bg-base text-fg-base" style={themeStyle(activeTheme)}>
            <SectionMenu sections={sections} archive={archive} activeAnchor={active.photo} />
            <main id="main-content" tabIndex={-1} className="delivery-content outline-none">
                {children}
            </main>
            {footer}
        </div>
    );
}
