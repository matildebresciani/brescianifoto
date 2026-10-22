import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { DeliveryHero } from '@/components/client-deliveries/DeliveryHero';
import { GalleryLightbox } from '@/components/client-deliveries/GalleryLightbox';
import { GallerySections } from '@/components/client-deliveries/GallerySections';
import { PhotoSection } from '@/components/client-deliveries/PhotoSection';
import { LivePreviewListener } from '@/components/molecules/admin/LivePreviewListener';
import RichText from '@/components/molecules/admin/RichText';
import { deliveryView, readDelivery } from '@/lib/client-deliveries/read';
import { themeStyle } from '@/lib/client-deliveries/shared';
import { deliveryMetadata } from '@/lib/client-deliveries/social';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
    params,
    searchParams,
}: {
    params: Promise<{ shareId: string }>;
    searchParams: Promise<{ preview?: string }>;
}) {
    return deliveryMetadata((await params).shareId, (await searchParams).preview === '1');
}

export default async function ClientGalleryPage({
    params,
    searchParams,
}: {
    params: Promise<{ shareId: string }>;
    searchParams: Promise<{ preview?: string }>;
}) {
    const { shareId } = await params;
    const isPreview = (await searchParams).preview === '1';
    const result = await readDelivery(shareId, isPreview, isPreview ? new Headers(await headers()) : undefined);
    if (!result) notFound();
    const gallery = await deliveryView(result, isPreview);
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
                Skip to photographs
            </a>
            {isPreview && (
                <aside className="border-b border-border-base bg-bg-subtle p-base text-center ui-text">
                    Saved draft preview · Only signed-in administrators can see this version.
                </aside>
            )}
            <div className={`relative${gallery.coverLayout === 'overlay' ? ' delivery-cover-area-overlay' : ''}`}>
                <div className="delivery-masthead flex items-center justify-between gap-base px-md py-md md:px-xl">
                    <span className="delivery-wordmark">brescianifoto</span>
                    <span className="metadata">{gallery.photoCount} photographs</span>
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
                            <p className="body-sm">Photographs by Matilde Bresciani</p>
                            <a
                                href="#top"
                                className="delivery-back-to-top ui-text underline underline-offset-4 focus-ring"
                            >
                                Back to top <span aria-hidden="true">↑</span>
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
                        Add text and photo sections in the gallery editor.
                    </p>
                )}
            </GallerySections>
        </div>
    );
}
