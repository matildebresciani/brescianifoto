'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { type ComponentProps, useState } from 'react';
import LightboxImage from '@/components/molecules/frontend/LightboxImage';
import { getLightboxImageKey } from '@/lib/utilities/lightbox-images';

/** Keep the last ready photo visible until its replacement has loaded, including during rapid navigation. */
export function GalleryLightboxStage({ image, onReady, ...props }: ComponentProps<typeof LightboxImage>) {
    const requestedKey = getLightboxImageKey(image);
    const shouldReduceMotion = useReducedMotion();
    const [stage, setStage] = useState({ requestedKey, displayed: image });
    if (stage.requestedKey !== requestedKey) {
        setStage({ requestedKey, displayed: stage.displayed });
    }
    const displayedKey = getLightboxImageKey(stage.displayed);
    const slides = displayedKey === requestedKey ? [image] : [stage.displayed, image];
    const reveal = () => {
        setStage((current) => (current.requestedKey === requestedKey ? { ...current, displayed: image } : current));
    };

    return (
        <div className="relative h-full min-h-0 min-w-0 flex-1">
            <AnimatePresence initial={false}>
                {slides.map((slide) => {
                    const key = getLightboxImageKey(slide);
                    const isCurrent = key === requestedKey;
                    return (
                        <motion.div
                            key={key}
                            data-lightbox-slide={key}
                            className="absolute inset-0"
                            inert={!isCurrent}
                            aria-hidden={!isCurrent}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: key === displayedKey ? 1 : 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: shouldReduceMotion ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <LightboxImage
                                {...props}
                                image={slide}
                                onReady={(size) => {
                                    if (!isCurrent) return;
                                    reveal();
                                    onReady?.(size);
                                }}
                                onLoadError={isCurrent ? reveal : undefined}
                            />
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
