import { mongooseAdapter } from '@payloadcms/db-mongodb';
import payload, { buildConfig, createLocalReq } from 'payload';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { payloadPublishedAt, payloadPublishStatus } from './publish-state';

beforeAll(async () => {
    payload.config = await buildConfig({
        secret: 'publish-state-unit-test',
        db: mongooseAdapter({ url: 'mongodb://127.0.0.1:27017/publish-state-unit-test' }),
        localization: { locales: ['da', 'en'], defaultLocale: 'da' },
        collections: [{ slug: 'galleries', fields: [payloadPublishedAt, payloadPublishStatus] }],
    });
});

afterEach(() => vi.useRealTimers());

type PublicationData = { publishStatus?: 'draft' | 'pendingApproval' | 'public'; publishedAt?: string | null };

const runHook = async (data: PublicationData, previous: PublicationData = {}) => {
    const req = await createLocalReq({ locale: 'da' }, payload);
    const collection = payload.config.collections.find((entry) => entry.slug === 'galleries');
    const hook = payloadPublishedAt.hooks?.beforeChange?.[0];
    if (!collection || !hook) throw new Error('Missing publication test fixture');
    return hook({
        blockData: undefined,
        collection,
        context: req.context,
        data,
        field: payloadPublishedAt,
        global: null,
        indexPath: [0],
        operation: 'update',
        path: ['publishedAt'],
        previousSiblingDoc: previous,
        previousValue: previous.publishedAt,
        req,
        schemaPath: ['publishedAt'],
        siblingData: data,
        siblingFields: collection.fields,
        value: data.publishedAt,
    });
};

describe('first publication timestamp', () => {
    it('sets the timestamp using the gallery public status without a native _status', async () => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date('2026-10-15T10:30:00Z'));
        expect(await runHook({ publishStatus: 'public', publishedAt: null })).toBe('2026-10-15T10:30:00.000Z');
    });

    it.each(['draft', 'pendingApproval'] as const)('does not timestamp %s saves', async (publishStatus) => {
        expect(await runHook({ publishStatus })).toBeUndefined();
    });

    it('preserves a supplied publication timestamp', async () => {
        const publishedAt = '2026-10-14T19:30:00Z';
        expect(await runHook({ publishStatus: 'public', publishedAt })).toBe(publishedAt);
    });

    it('preserves the first timestamp through partial updates, clearing and republication', async () => {
        const publishedAt = '2026-10-14T19:30:00Z';
        const previous = { publishedAt, publishStatus: 'public' } satisfies PublicationData;
        expect(await runHook({}, previous)).toBe(publishedAt);
        expect(await runHook({ publishedAt: null }, previous)).toBe(publishedAt);
        expect(await runHook({ publishStatus: 'draft' }, previous)).toBe(publishedAt);
        expect(await runHook({ publishStatus: 'public' }, { publishedAt, publishStatus: 'draft' })).toBe(publishedAt);
    });

    it('fills missing timestamps when an already public gallery is next saved', async () => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date('2026-10-15T10:30:00Z'));
        expect(await runHook({}, { publishStatus: 'public' })).toBe('2026-10-15T10:30:00.000Z');
    });
});
