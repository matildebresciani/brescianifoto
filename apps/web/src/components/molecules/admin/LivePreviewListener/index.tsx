'use client';
import { RefreshRouteOnSave as PayloadLivePreview } from '@payloadcms/live-preview-react';
import { useRouter } from 'next/navigation';
import type React from 'react';
import { getClientSideURL } from '@/lib/utilities/get-url';

export const LivePreviewListener: React.FC = () => {
    const router = useRouter();
    return <PayloadLivePreview refresh={router.refresh} serverURL={getClientSideURL()} />;
};
