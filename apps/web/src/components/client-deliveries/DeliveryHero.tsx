import Image from 'next/image';
import RichText from '@/components/molecules/admin/RichText';
import type { DeliveryView } from '@/lib/client-deliveries/view';

export function DeliveryHero({ gallery }: { gallery: DeliveryView }) {
    const isOverlay = gallery.coverLayout === 'overlay';
    const content = (
        <div className="delivery-hero-copy" style={{ textAlign: gallery.alignment }}>
            <h1 className="statement">{gallery.title}</h1>
            {(gallery.date || gallery.location) && (
                <p className="metadata mt-lg">
                    {gallery.date && (
                        <time dateTime={gallery.date.slice(0, 10)}>
                            {new Intl.DateTimeFormat('en-GB', {
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
            {gallery.details && <RichText data={gallery.details} enableGutter={false} className="mt-base" />}
        </div>
    );
    return (
        <header id="top" className={`delivery-hero ${isOverlay ? 'delivery-hero-overlay' : ''}`}>
            {!isOverlay && content}
            {gallery.cover && (
                <div className="delivery-cover-frame">
                    <Image
                        src={gallery.cover.src}
                        alt={`${gallery.title} — featured photograph`}
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
    );
}
