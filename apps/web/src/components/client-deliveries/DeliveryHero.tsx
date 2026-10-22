import { hasText } from '@payloadcms/richtext-lexical/shared';
import { ArrowDown } from 'lucide-react';
import Image from 'next/image';
import RichText from '@/components/molecules/admin/RichText';
import type { DeliveryView } from '@/lib/client-deliveries/view';

export function DeliveryHero({ gallery }: { gallery: DeliveryView }) {
    const isOverlay = gallery.coverLayout === 'overlay';
    const details = hasText(gallery.details) ? gallery.details : null;
    const content = (
        <div className="delivery-hero-copy" style={{ textAlign: gallery.alignment }}>
            <h1 className="statement">{gallery.title}</h1>
            {(gallery.date || gallery.location) && (
                <p className="metadata mt-lg">
                    {gallery.date && (
                        <time dateTime={gallery.date.slice(0, 10)}>
                            {new Intl.DateTimeFormat('da-DK', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                timeZone: 'UTC',
                            }).format(new Date(gallery.date))}
                        </time>
                    )}
                    {gallery.date && gallery.location ? ' · ' : ''}
                    {gallery.location}
                </p>
            )}
            {!isOverlay && details && <RichText data={details} enableGutter={false} isDelivery className="mt-base" />}
            {gallery.photoCount > 0 && (
                <div className="mt-md">
                    <a
                        href="#main-content"
                        className="delivery-hero-link focus-ring ui-text inline-flex min-h-12 items-center justify-center gap-xs rounded-[var(--btn-radius)] border border-current px-md py-xs no-underline"
                    >
                        Se galleriet
                        <ArrowDown aria-hidden="true" size={16} strokeWidth={1.5} />
                    </a>
                </div>
            )}
        </div>
    );
    return (
        <>
            <header id="top" className={`delivery-hero ${isOverlay ? 'delivery-hero-overlay' : ''}`}>
                {!isOverlay && content}
                {gallery.cover && (
                    <div className="delivery-cover-frame">
                        <Image
                            src={gallery.cover.src}
                            alt={`${gallery.title} — forsidebillede`}
                            width={gallery.cover.width}
                            height={gallery.cover.height}
                            sizes="100vw"
                            priority
                            className="delivery-cover"
                            style={{ objectPosition: `${gallery.focalX}% ${gallery.focalY}%` }}
                        />
                    </div>
                )}
                {isOverlay && content}
            </header>
            {isOverlay && details && (
                <div className="delivery-welcome bg-bg-base px-md py-xl text-fg-base md:px-xl">
                    <div className="mx-auto max-w-[65ch]">
                        <RichText data={details} enableGutter={false} isDelivery />
                    </div>
                </div>
            )}
        </>
    );
}
