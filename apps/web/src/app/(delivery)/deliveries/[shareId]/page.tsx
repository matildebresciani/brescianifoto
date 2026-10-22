import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { DeliveryGallery } from '@/components/client-deliveries/DeliveryGallery';
import { deliveryView, readDelivery } from '@/lib/client-deliveries/read';
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
    return <DeliveryGallery gallery={await deliveryView(result, isPreview)} />;
}
