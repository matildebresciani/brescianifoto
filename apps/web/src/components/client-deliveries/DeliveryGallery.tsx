import { DeliveryHero } from '@/components/client-deliveries/DeliveryHero';
import { GalleryLightbox } from '@/components/client-deliveries/GalleryLightbox';
import { GallerySections } from '@/components/client-deliveries/GallerySections';
import { PhotoSection } from '@/components/client-deliveries/PhotoSection';
import { LivePreviewListener } from '@/components/molecules/admin/LivePreviewListener';
import RichText from '@/components/molecules/admin/RichText';
import { themeStyle } from '@/lib/client-deliveries/shared';
import type { DeliveryView } from '@/lib/client-deliveries/view';

/** Keeps draft previews and published deliveries on the same rendering path. */
export function DeliveryGallery({ gallery }: { gallery: DeliveryView }) {
    const isPreview = gallery.isPreview;
    const style = themeStyle(gallery.theme);
    style['--delivery-overlay-color'] = gallery.overlayColor;
    style['--delivery-overlay-opacity'] = `${gallery.overlayOpacity}%`;
    const sections = gallery.blocks.flatMap((block) =>
        block.type === 'photos' ? [{ anchor: block.anchor, label: block.menuLabel, theme: block.theme }] : [],
    );
    const photos = gallery.blocks.flatMap((block) => (block.type === 'photos' ? block.photos : []));
    const blockThemes = gallery.blocks.map((block) => ({
        anchor: block.type === 'photos' ? block.anchor : `delivery-block-${block.id}`,
        theme: block.theme,
    }));
    return (
        <div className="delivery-page min-h-svh bg-bg-base text-fg-base" style={style}>
            {isPreview && <LivePreviewListener />}
            <a href="#main-content" className="skip-link ui-text">
                Gå til billederne
            </a>
            {isPreview && (
                <aside className="border-b border-border-base bg-bg-subtle p-base text-center ui-text">
                    Forhåndsvisning af gemt kladde · Kun administratorer, der er logget ind, kan se denne version.
                </aside>
            )}
            <div className={`relative${gallery.coverLayout === 'overlay' ? ' delivery-cover-area-overlay' : ''}`}>
                <div className="delivery-masthead flex flex-wrap items-center justify-between gap-base px-md py-md md:px-xl">
                    <span className="delivery-wordmark">brescianifoto</span>
                    <span className="metadata">{gallery.photoCount} billeder</span>
                </div>
                <DeliveryHero gallery={gallery} />
            </div>
            <GallerySections
                sections={sections}
                blocks={blockThemes}
                archive={gallery.archive}
                theme={gallery.theme}
                footer={
                    <footer className="delivery-footer px-md text-fg-base md:px-xl">
                        <div className="flex flex-wrap items-center justify-between gap-md py-xl">
                            <p className="body-sm">Fotografier af Matilde Bresciani</p>
                            <a
                                href="#top"
                                className="delivery-back-to-top ui-text underline underline-offset-4 focus-ring"
                            >
                                Til toppen <span aria-hidden="true">↑</span>
                            </a>
                        </div>
                    </footer>
                }
            >
                <GalleryLightbox photos={photos}>
                    {gallery.blocks.map((block) =>
                        block.type === 'text' ? (
                            <div
                                key={block.id}
                                id={`delivery-block-${block.id}`}
                                className="delivery-text-section text-fg-base"
                            >
                                <div className="delivery-section-inner">
                                    <div className="delivery-text">
                                        <RichText data={block.content} enableGutter={false} isDelivery />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <PhotoSection
                                key={block.id}
                                block={block}
                                desktopColumns={gallery.desktopColumns}
                                photoSpacing={gallery.photoSpacing}
                                shouldInheritTheme
                            />
                        ),
                    )}
                </GalleryLightbox>
                {!gallery.blocks.length && isPreview && (
                    <p className="delivery-section-inner body-lg py-section">
                        Tilføj tekst- og billedsektioner i galleriets editor.
                    </p>
                )}
            </GallerySections>
        </div>
    );
}
