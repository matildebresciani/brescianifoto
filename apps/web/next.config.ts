import { withPayload } from '@payloadcms/next/withPayload';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import redirects from './redirects';

const NEXT_PUBLIC_SERVER_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000';

const isHttpOrHttps = (proto: string) => proto === 'http' || proto === 'https';

const withNextIntl = createNextIntlPlugin();

// Allow signed image queries only for this client's bucket and photo prefix.
const clientImagePatterns: NonNullable<NonNullable<NextConfig['images']>['remotePatterns']> =
    process.env.CLIENT_R2_ENDPOINT && process.env.CLIENT_R2_BUCKET
        ? [
              {
                  protocol: 'https',
                  hostname: new URL(process.env.CLIENT_R2_ENDPOINT).hostname,
                  pathname: `/${process.env.CLIENT_R2_BUCKET}/client-deliveries/**`,
              },
          ]
        : [];

const nextConfig: NextConfig = {
    // The color-picker package ships JSX source rather than compiled JavaScript.
    transpilePackages: ['@innovixx/payload-color-picker-field'],
    // Allows isolated QA previews alongside the photographer's normal development server.
    distDir: process.env.NEXT_BUILD_DIR || '.next',
    images: {
        formats: ['image/webp'],
        qualities: [75, 90],
        remotePatterns: [
            ...clientImagePatterns,
            ...[...new Set([NEXT_PUBLIC_SERVER_URL, process.env.NEXT_PUBLIC_SERVER_URL, process.env.R2_PUBLIC_URL])]
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
    async headers() {
        return [
            {
                source: '/_next/image',
                has: [{ type: 'query', key: 'url', value: '.*client-deliveries.*' }],
                headers: [{ key: 'X-Robots-Tag', value: 'noindex, noimageindex' }],
            },
            {
                source: '/deliveries/:path*',
                headers: [
                    { key: 'X-Robots-Tag', value: 'noindex, nofollow, noimageindex' },
                    { key: 'Referrer-Policy', value: 'no-referrer' },
                    { key: 'Cache-Control', value: 'private, no-store' },
                ],
            },
        ];
    },
    redirects,
};

export default withPayload(withNextIntl(nextConfig), { devBundleServerPackages: false });
