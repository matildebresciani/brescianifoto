import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { DeliveryHero } from '@/components/client-deliveries/DeliveryHero';
import { GalleryLightbox } from '@/components/client-deliveries/GalleryLightbox';
import { PhotoSection } from '@/components/client-deliveries/PhotoSection';
import { SectionMenu } from '@/components/client-deliveries/SectionMenu';
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
            <SectionMenu
                sections={sections}
                archive={gallery.archive}
                theme={gallery.blocks.find((block) => block.type === 'photos')?.theme ?? gallery.theme}
            />
            <main id="main-content" tabIndex={-1} className="delivery-content outline-none">
                <GalleryLightbox photos={photos}>
                    {gallery.blocks.map((block, index) =>
                        block.type === 'text' ? (
                            <div
                                key={block.id}
                                className="delivery-text-section bg-bg-base text-fg-base"
                                style={themeStyle(block.theme, gallery.blocks[index - 1]?.theme ?? gallery.theme)}
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
                                previousTheme={gallery.blocks[index - 1]?.theme ?? gallery.theme}
                            />
                        ),
                    )}
                </GalleryLightbox>
                {!gallery.blocks.length && isPreview && (
                    <p className="delivery-section-inner body-lg py-section">
                        Add text and photo sections in the gallery editor.
                    </p>
                )}
            </main>
            <footer
                className="delivery-footer bg-bg-base px-md text-fg-base md:px-xl"
                style={themeStyle(gallery.blocks.at(-1)?.theme ?? gallery.theme)}
            >
                <div className="flex flex-wrap items-center justify-between gap-md border-t border-border-base py-xl">
                    <p className="body-sm">Photographs by Matilde Bresciani</p>
                    <a href="#top" className="delivery-back-to-top ui-text underline underline-offset-4 focus-ring">
                        Back to top <span aria-hidden="true">↑</span>
                    </a>
                </div>
            </footer>
        </div>
    );
}
