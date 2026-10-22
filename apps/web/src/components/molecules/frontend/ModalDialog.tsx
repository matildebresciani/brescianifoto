'use client';

import { type HTMLMotionProps, motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef } from 'react';

type Props = HTMLMotionProps<'div'> & {
    isOpen?: boolean;
    onClose: () => void;
    shouldAnimate?: boolean;
};

/** Render inside Portal so focus management starts after the dialog exists in the DOM. */
export default function ModalDialog({ isOpen = true, shouldAnimate = false, onClose, children, ...props }: Props) {
    const dialogRef = useRef<HTMLDivElement>(null);
    const closeRef = useRef(onClose);
    const shouldReduceMotion = useReducedMotion();
    useEffect(() => {
        closeRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!isOpen || !dialog) return;
        const opener = document.activeElement;
        const overflow = document.body.style.overflow;
        const siblings = [...document.body.children].filter(
            (element): element is HTMLElement => element instanceof HTMLElement && element !== dialog,
        );
        const inertStates = siblings.map((element) => element.inert);
        for (const sibling of siblings) sibling.inert = true;
        document.body.style.overflow = 'hidden';
        dialog.focus();

        const focusable = () =>
            [
                ...dialog.querySelectorAll<HTMLElement>(
                    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]',
                ),
            ].filter(
                (element) =>
                    element.tabIndex >= 0 && element.getClientRects().length > 0 && !element.closest('[inert]'),
            );
        const handleKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                event.stopImmediatePropagation();
                closeRef.current();
                return;
            }
            if (event.key !== 'Tab') return;
            const elements = focusable();
            const first = elements[0];
            const last = elements.at(-1);
            if (!first || !last) {
                event.preventDefault();
                dialog.focus();
                return;
            }
            if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog)) {
                event.preventDefault();
                first.focus();
            }
        };
        const handleFocus = (event: FocusEvent) => {
            if (event.target instanceof Node && !dialog.contains(event.target)) dialog.focus();
        };
        document.addEventListener('keydown', handleKey, true);
        document.addEventListener('focusin', handleFocus);
        return () => {
            document.removeEventListener('keydown', handleKey, true);
            document.removeEventListener('focusin', handleFocus);
            document.body.style.overflow = overflow;
            siblings.forEach((element, index) => {
                element.inert = inertStates[index] ?? false;
            });
            if (opener instanceof HTMLElement && opener.isConnected) opener.focus({ preventScroll: true });
        };
    }, [isOpen]);

    return (
        <motion.div
            {...props}
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            inert={!isOpen}
            initial={shouldAnimate && !shouldReduceMotion ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldAnimate && !shouldReduceMotion ? 0.24 : 0 }}
        >
            {children}
        </motion.div>
    );
}
