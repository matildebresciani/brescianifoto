import { createHmac, timingSafeEqual } from 'node:crypto';

/** Signs a short-lived, action-specific maintenance request without transmitting the Payload secret. */
const signMaintenance = (secret: string, action: string, mode: string, timestamp: string): string =>
    createHmac('sha256', secret).update(`${action}:${mode}:${timestamp}`).digest('hex');

export const signFestivalMaintenance = (secret: string, mode: string, timestamp: string): string =>
    signMaintenance(secret, 'festival-urls', mode, timestamp);

export const signPortfolioSetup = (secret: string, mode: string, timestamp: string): string =>
    signMaintenance(secret, 'portfolio-setup', mode, timestamp);

/** Rejects expired signatures and signatures issued for a different maintenance action. */
const canRunMaintenance = (secret: string, action: string, mode: string, headers: Headers): boolean => {
    const timestamp = headers.get('x-maintenance-timestamp') ?? '';
    const signature = headers.get('x-maintenance-signature') ?? '';
    if (
        !/^\d+$/.test(timestamp) ||
        Math.abs(Date.now() - Number(timestamp)) > 60000 ||
        !/^[a-f0-9]{64}$/.test(signature)
    )
        return false;
    return timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(signMaintenance(secret, action, mode, timestamp), 'hex'),
    );
};

export const canRunFestivalMaintenance = (secret: string, mode: string, headers: Headers): boolean =>
    canRunMaintenance(secret, 'festival-urls', mode, headers);

export const canRunPortfolioSetup = (secret: string, mode: string, headers: Headers): boolean =>
    canRunMaintenance(secret, 'portfolio-setup', mode, headers);
