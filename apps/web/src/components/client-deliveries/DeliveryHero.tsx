import { hasText } from '@payloadcms/richtext-lexical/shared';
import RichText from '@/components/molecules/admin/RichText';
import type { DeliveryView } from '@/lib/client-deliveries/view';
import { DeliveryCover } from './DeliveryCover';
import { RollingButtonLabel } from './RollingButtonLabel';

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
                        className="delivery-hero-link focus-ring metadata inline-flex min-h-12 items-center justify-center rounded-[var(--btn-radius)] border border-current px-md py-xs no-underline"
                    >
                        <RollingButtonLabel label="Se galleriet" />
                    </a>
                </div>
            )}
        </div>
    );
    return (
        <>
            <header className={`delivery-hero ${isOverlay ? 'delivery-hero-overlay' : ''}`}>
                {!isOverlay && content}
                {gallery.cover && (
                    <DeliveryCover
                        cover={gallery.cover}
                        alt={`${gallery.title} — forsidebillede`}
                        isOverlay={isOverlay}
                        focalX={gallery.focalX}
                        focalY={gallery.focalY}
                    />
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
