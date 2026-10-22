'use client';

import { motion, useReducedMotion } from 'motion/react';
import { type ComponentProps, useState } from 'react';
import LightboxImage from '@/components/molecules/frontend/LightboxImage';
import { getLightboxImageKey } from '@/lib/utilities/lightbox-images';

/** Keep the last ready photo opaque until its replacement has loaded and finished fading in. */
export function LightboxStage({ image, onReady, ...props }: ComponentProps<typeof LightboxImage>) {
    const requestedKey = getLightboxImageKey(image);
    const shouldReduceMotion = useReducedMotion();
    const [stage, setStage] = useState<{ requestedKey: string; displayed: typeof image; readyKey: string | null }>({
        requestedKey,
        displayed: image,
        readyKey: null,
    });
    if (stage.requestedKey !== requestedKey) {
        setStage({ requestedKey, displayed: stage.displayed, readyKey: null });
    }
    const displayedKey = getLightboxImageKey(stage.displayed);
    const slides = displayedKey === requestedKey ? [image] : [stage.displayed, image];
    const reveal = () => {
        setStage((current) =>
            current.requestedKey === requestedKey && current.readyKey !== requestedKey
                ? { ...current, readyKey: requestedKey }
                : current,
        );
    };

    return (
        <div className="relative h-full min-h-0 min-w-0 flex-1">
            {slides.map((slide) => {
                const key = getLightboxImageKey(slide);
                const isCurrent = key === requestedKey;
                return (
                    <motion.div
                        key={key}
                        data-lightbox-slide={key}
                        className="absolute inset-0 bg-bg-base"
                        inert={!isCurrent}
                        aria-hidden={!isCurrent}
                        initial={{ opacity: key === displayedKey ? 1 : 0 }}
                        animate={{ opacity: key === displayedKey || key === stage.readyKey ? 1 : 0 }}
                        transition={{ duration: shouldReduceMotion ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
                        onAnimationComplete={() => {
                            if (!isCurrent || stage.readyKey !== key) return;
                            // Keep the opaque backing slide until the replacement covers the full photo area.
                            setStage((current) =>
                                current.requestedKey === key && getLightboxImageKey(current.displayed) !== key
                                    ? { ...current, displayed: image }
                                    : current,
                            );
                        }}
                    >
                        <LightboxImage
                            {...props}
                            image={slide}
                            isActive={isCurrent}
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
        </div>
    );
}
