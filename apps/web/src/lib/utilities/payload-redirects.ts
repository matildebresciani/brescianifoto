import { permanentRedirect, redirect } from 'next/navigation';
import { getCachedRedirects } from '../data/payload/get-redirects';

export const payloadRedirects = async (url: string) => {
    const redirects = await getCachedRedirects();

    const formattedUrl = url.startsWith('/') ? url : `/${url}`;
    const redirectItem = redirects.find((redirect) => redirect.redirectFrom === formattedUrl);

    if (redirectItem?.redirectTo && redirectItem?.active) {
        if (redirectItem.redirectType === '308') {
            permanentRedirect(redirectItem.redirectTo);
        } else {
            return redirect(redirectItem.redirectTo);
        }
    }
};
