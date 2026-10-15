import { createHmac, timingSafeEqual } from 'node:crypto';

/** Signs a short-lived, action-specific maintenance request without transmitting the Payload secret. */
export const signFestivalMaintenance = (secret: string, mode: string, timestamp: string): string =>
    createHmac('sha256', secret).update(`festival-urls:${mode}:${timestamp}`).digest('hex');

/** Rejects expired signatures and signatures issued for a different maintenance action. */
export const canRunFestivalMaintenance = (secret: string, mode: string, headers: Headers): boolean => {
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
        Buffer.from(signFestivalMaintenance(secret, mode, timestamp), 'hex'),
    );
};
