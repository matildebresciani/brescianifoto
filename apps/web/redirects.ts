import type { NextConfig } from 'next';

type Redirects = Awaited<ReturnType<NonNullable<NextConfig['redirects']>>>;
type Redirect = Redirects[number];

const redirects = async (): Promise<Redirects> => {
    const internetExplorerRedirect: Redirect = {
        destination: '/ie-incompatible.html',
        has: [
            {
                type: 'header',
                key: 'user-agent',
                value: '(.*Trident.*)', // all ie browsers
            },
        ],
        permanent: false,
        source: '/:path((?!ie-incompatible.html$).*)', // all pages except the incompatibility page
    };

    const redirects = [internetExplorerRedirect];

    return redirects;
};

export default redirects;
