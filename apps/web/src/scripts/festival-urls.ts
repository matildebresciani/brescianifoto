import type { SanitizedConfig } from 'payload';
import { getServerSideURL } from '@/lib/utilities/get-url';
import { signFestivalMaintenance } from '@/lib/utilities/maintenance-auth';

/** Calls the running app so maintenance updates and cache invalidation happen in the same environment. */
export const script = async (config: SanitizedConfig) => {
    const mode = process.argv.includes('--apply') ? 'apply' : 'dry-run';
    const timestamp = String(Date.now());
    const url = new URL('/api/maintenance/festival-urls', getServerSideURL());
    url.searchParams.set('mode', mode);
    await fetch(url, {
        method: 'POST',
        headers: {
            'x-maintenance-timestamp': timestamp,
            'x-maintenance-signature': signFestivalMaintenance(config.secret, mode, timestamp),
        },
    }).then(
        async (response) => {
            console.log(await response.text());
            // Payload's bin runner always exits zero after returning from a custom script.
            if (!response.ok) process.exit(1);
        },
        () => {
            console.error(
                `Could not reach ${url.origin}. Start the app with this configuration before running festival URL maintenance.`,
            );
            process.exit(1);
        },
    );
};
