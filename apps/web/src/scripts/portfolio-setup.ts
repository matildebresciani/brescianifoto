import type { SanitizedConfig } from 'payload';
import { getServerSideURL } from '@/lib/utilities/get-url';
import { signPortfolioSetup } from '@/lib/utilities/maintenance-auth';

/** Use --apply after reviewing the dry run; --url targets the running local or deployed app. */
export const script = async (config: SanitizedConfig) => {
    const mode = process.argv.includes('--apply') ? 'apply' : 'dry-run';
    const timestamp = String(Date.now());
    const urlIndex = process.argv.indexOf('--url');
    const url = new URL(
        '/api/maintenance/portfolio-setup',
        (urlIndex >= 0 ? process.argv[urlIndex + 1] : undefined) || getServerSideURL(),
    );
    url.searchParams.set('mode', mode);
    await fetch(url, {
        method: 'POST',
        signal: AbortSignal.timeout(60000),
        headers: {
            'x-maintenance-timestamp': timestamp,
            'x-maintenance-signature': signPortfolioSetup(config.secret, mode, timestamp),
        },
    }).then(
        async (response) => {
            console.log(await response.text());
            process.exit(response.ok ? 0 : 1);
        },
        (error: unknown) => {
            console.error(error);
            process.exit(1);
        },
    );
};
