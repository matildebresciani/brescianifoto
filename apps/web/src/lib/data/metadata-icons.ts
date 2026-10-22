import type { Metadata } from 'next';

/** Shared branding for the portfolio and client galleries. */
export const metadataIcons: Metadata['icons'] = {
    icon: [
        { url: '/favicon.ico', sizes: '16x16 32x32 48x48', type: 'image/x-icon' },
        { url: '/images/favicons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
        { url: '/images/favicons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        { url: '/images/favicons/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
        { url: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/images/favicons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
};
