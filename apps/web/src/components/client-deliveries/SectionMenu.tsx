'use client';

import { ChevronDown } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useId, useRef, useState } from 'react';
import type { DeliveryView } from '@/lib/client-deliveries/view';
import { DownloadArchiveButton } from './DownloadArchiveButton';

export function SectionMenu({
    sections,
    archive,
    activeAnchor,
}: {
    sections: { anchor: string; label: string }[];
    archive: DeliveryView['archive'];
    activeAnchor?: string;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const shouldReduceMotion = useReducedMotion();
    const menuId = useId();
    const trigger = useRef<HTMLButtonElement>(null);
    const links = sections.map((section) => (
        <a
            key={section.anchor}
            href={`#${section.anchor}`}
            className="delivery-nav-link focus-ring ui-text"
            aria-current={activeAnchor === section.anchor ? 'location' : undefined}
            onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                event.preventDefault();
                setIsOpen(false);
                requestAnimationFrame(() => {
                    const target = document.getElementById(section.anchor);
                    if (!target) return;
                    if (window.location.hash !== `#${section.anchor}`) {
                        window.history.pushState(null, '', `#${section.anchor}`);
                    }
                    target.focus({ preventScroll: true });
                    // Complete chapter jumps atomically: mobile browsers can cancel smooth scrolling as the menu closes.
                    target.scrollIntoView({ block: 'start', behavior: 'instant' });
                });
            }}
        >
            <span>{section.label}</span>
        </a>
    ));
    return (
        <nav className="delivery-nav bg-bg-base text-fg-base" aria-label="Galleriets sektioner">
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
                    <span className="min-w-0 wrap-anywhere">
                        {sections.find((section) => section.anchor === activeAnchor)?.label || 'Sektioner'}
                    </span>
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
            {archive && <DownloadArchiveButton key={archive.href} href={archive.href} byteSize={archive.byteSize} />}
        </nav>
    );
}
