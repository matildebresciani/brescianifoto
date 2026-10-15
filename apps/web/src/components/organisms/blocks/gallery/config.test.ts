import { mongooseAdapter } from '@payloadcms/db-mongodb';
import payload, { beforeValidateTraverseFields, buildConfig, createLocalReq, type JsonObject } from 'payload';
import { beforeAll, describe, expect, it } from 'vitest';
import { Gallery } from './config';

beforeAll(async () => {
    payload.config = await buildConfig({
        secret: 'gallery-selection-lifecycle-test',
        db: mongooseAdapter({ url: 'mongodb://127.0.0.1:27017/gallery-selection-lifecycle-test' }),
        localization: { locales: ['da', 'en'], defaultLocale: 'da' },
        collections: [
            { slug: 'pages', fields: [] },
            { slug: 'media', fields: [] },
        ],
    });
});

const validateSelection = async (block: JsonObject, previousBlock: JsonObject) => {
    const req = await createLocalReq({ locale: 'en' }, payload);
    await beforeValidateTraverseFields({
        collection: null,
        global: null,
        context: {},
        fields: Gallery.fields.filter((field) => 'name' in field && field.name === 'selectionMode'),
        data: block,
        doc: previousBlock,
        siblingData: block,
        siblingDoc: previousBlock,
        operation: previousBlock.id ? 'update' : 'create',
        overrideAccess: true,
        parentPath: 'layout.0',
        parentSchemaPath: 'layout',
        parentIndexPath: '0',
        req,
    });
    return block;
};

describe('gallery selection defaults during Payload saves', () => {
    it('keeps legacy manual photos when a locale save omits the mode', async () => {
        const previous = { id: 'existing', blockType: 'gallery', gallery: ['second', 'first'] };
        expect(await validateSelection({ ...previous }, previous)).toMatchObject({
            selectionMode: 'custom',
            gallery: ['second', 'first'],
        });
    });

    it('defaults new blocks to Random and preserves explicit mode changes', async () => {
        expect(await validateSelection({ blockType: 'gallery' }, {})).toMatchObject({ selectionMode: 'random' });
        const previous = { id: 'existing', blockType: 'gallery', selectionMode: 'custom', gallery: ['photo'] };
        expect(await validateSelection({ ...previous, selectionMode: 'random' }, previous)).toMatchObject({
            selectionMode: 'random',
            gallery: ['photo'],
        });
    });
});
