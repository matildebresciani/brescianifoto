import { withPayload } from '@payloadcms/next/withPayload';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import redirects from './redirects';

const NEXT_PUBLIC_SERVER_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000';

const isHttpOrHttps = (proto: string) => proto === 'http' || proto === 'https';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            ...[NEXT_PUBLIC_SERVER_URL, process.env.R2_PUBLIC_URL]
                .filter((item): item is string => Boolean(item))
                .map((item): { hostname: string; protocol: 'http' | 'https'; port: string } => {
                    const url = new URL(item);

                    const protocol = url.protocol.replace(':', '');
                    if (!isHttpOrHttps(protocol)) {
                        throw new Error(`Invalid protocol: ${protocol}`);
                    }

                    return {
                        hostname: url.hostname,
                        protocol: protocol === 'https' ? 'https' : 'http',
                        port: url.port,
                    };
                }),
        ],
        dangerouslyAllowLocalIP: process.env.NODE_ENV !== 'production',
    },
    reactStrictMode: true,
    redirects,
};

export default withPayload(withNextIntl(nextConfig), { devBundleServerPackages: false });
