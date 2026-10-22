'use client';

import { motion, useReducedMotion } from 'motion/react';
import Image from 'next/image';
import { useContext } from 'react';
import RichText from '@/components/molecules/admin/RichText';
import { themeStyle } from '@/lib/client-deliveries/shared';
import type { DeliveryBlock } from '@/lib/client-deliveries/view';
import { GalleryLightboxContext } from './GalleryLightbox';

export function PhotoSection({ block }: { block: Extract<DeliveryBlock, { type: 'photos' }> }) {
    const openPhoto = useContext(GalleryLightboxContext);
    const shouldReduceMotion = useReducedMotion();
    return (
        <section
            id={block.anchor}
            tabIndex={-1}
            className="delivery-section bg-bg-base text-fg-base outline-none"
            style={themeStyle(block.theme)}
            aria-label={block.menuLabel}
        >
            <div className="delivery-section-inner">
                {block.introduction && (
                    <div className="delivery-section-introduction">
                        <RichText data={block.introduction} enableGutter={false} isDelivery />
                    </div>
                )}
                <div className="delivery-photo-grid">
                    {block.photos.map((photo, photoIndex) => (
                        <motion.figure
                            key={`${photo.id}-${photoIndex}`}
                            className="delivery-photo m-0"
                            // The reduced-motion media rule supplies the static state before hydration too.
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.05 }}
                            transition={{
                                duration: shouldReduceMotion ? 0 : 0.6,
                                delay: shouldReduceMotion ? 0 : (photoIndex % 3) * 0.06,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                        >
                            <button
                                type="button"
                                className="group focus-ring-tight block w-full overflow-hidden bg-bg-subtle"
                                aria-label={`Open photo ${photoIndex + 1}: ${photo.name}`}
                                onClick={() => openPhoto?.(photo, block.theme)}
                            >
                                <Image
                                    src={photo.src}
                                    alt={photo.name}
                                    width={photo.width}
                                    height={photo.height}
                                    sizes="(min-width: 1024px) 32vw, 48vw"
                                    loading="lazy"
                                    className="h-auto w-full transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transform-none motion-reduce:transition-none"
                                />
                            </button>
                        </motion.figure>
                    ))}
                </div>
            </div>
        </section>
    );
}
