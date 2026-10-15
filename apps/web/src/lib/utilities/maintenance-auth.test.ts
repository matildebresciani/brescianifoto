import { describe, expect, it } from 'vitest';
import { canRunFestivalMaintenance, signFestivalMaintenance } from './maintenance-auth';

const secret = 'maintenance-unit-test';
const getHeaders = (timestamp = String(Date.now()), mode = 'dry-run') =>
    new Headers({
        'x-maintenance-timestamp': timestamp,
        'x-maintenance-signature': signFestivalMaintenance(secret, mode, timestamp),
    });

describe('festival maintenance authorization', () => {
    it('accepts current signatures for their signed action only', () => {
        const headers = getHeaders();
        expect(canRunFestivalMaintenance(secret, 'dry-run', headers)).toBe(true);
        expect(canRunFestivalMaintenance(secret, 'apply', headers)).toBe(false);
        expect(canRunFestivalMaintenance('wrong-secret', 'dry-run', headers)).toBe(false);
    });

    it('rejects expired, future, missing and malformed signatures', () => {
        expect(canRunFestivalMaintenance(secret, 'dry-run', getHeaders(String(Date.now() - 61000)))).toBe(false);
        expect(canRunFestivalMaintenance(secret, 'dry-run', getHeaders(String(Date.now() + 61000)))).toBe(false);
        expect(canRunFestivalMaintenance(secret, 'dry-run', new Headers())).toBe(false);
        const headers = getHeaders();
        headers.set('x-maintenance-signature', 'invalid');
        expect(canRunFestivalMaintenance(secret, 'dry-run', headers)).toBe(false);
    });
});
