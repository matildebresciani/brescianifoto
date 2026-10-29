import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mergePhotos, sharedAlt } from './share-public-photos.mjs';

test('merge preserves Danish ordering and recovers English-only photos', () => {
    assert.deepEqual(mergePhotos({ da: ['b', 'a'], en: ['a', 'c'] }), ['b', 'a', 'c']);
    assert.deepEqual(mergePhotos({ en: ['c'] }), ['c']);
    assert.deepEqual(mergePhotos({ da: ['b'] }), ['b']);
    assert.deepEqual(mergePhotos({ da: [], en: [] }), []);
    assert.deepEqual(mergePhotos(mergePhotos({ en: ['c'] })), ['c']);
});
test('alt uses Danish first with English recovery and is idempotent', () => {
    assert.equal(sharedAlt({ da: 'Danish', en: 'English' }), 'Danish');
    assert.equal(sharedAlt({ da: ' ', en: 'English' }), 'English');
    assert.equal(sharedAlt({ en: 'English' }), 'English');
    assert.equal(sharedAlt({ da: '', en: '' }), '');
    assert.equal(sharedAlt(sharedAlt({ en: 'English' })), 'English');
});

test('raw Mongo blocks pair by _id, versions preserve history, and client data is excluded', async () => {
    const { createRequire } = await import('node:module');
    const require = createRequire(import.meta.url);
    const { mongo } = createRequire(require.resolve('@payloadcms/db-mongodb'))('mongoose');
    const { planPublicPhotoMigration } = await import('./share-public-photos.mjs');
    const a = new mongo.ObjectId();
    const b = new mongo.ObjectId();
    const block = (photos) => ({ _id: 'stable-block', blockType: 'gallery', selectionMode: 'custom', gallery: photos });
    const records = {
        galleries: [{ _id: new mongo.ObjectId(), gallery: { en: [a] }, publishStatus: { da: 'draft', en: 'public' } }],
        pages: [{ _id: new mongo.ObjectId(), layout: { da: [block([a])], en: [block([a, b])] } }],
        _pages_versions: [{ _id: new mongo.ObjectId(), version: { layout: { da: [block([b])] } } }],
        media: [{ _id: a, alt: { en: 'English-only photo' }, caption: { da: 'Keep me' } }],
        icons: [],
        _galleries_versions: [],
    };
    const queried = [];
    const db = {
        collection: (name) => {
            queried.push(name);
            return { find: () => ({ toArray: async () => records[name] }) };
        },
    };
    const plan = await planPublicPhotoMigration(
        db,
        mongo.BSON ? { EJSON: mongo.BSON.EJSON, ObjectId: mongo.ObjectId } : {},
    );
    assert.equal(plan.selections.length, 2);
    assert.deepEqual(plan.selections[0].gallery.map(String), [String(a), String(b)]);
    assert.deepEqual(plan.selections[1].gallery.map(String), [String(b)]);
    assert.equal(plan.unmatched.length, 1);
    assert.equal(plan.recoveredGalleries.length, 1);
    assert.equal(plan.visibility.length, 1);
    const page = plan.changes.find((change) => change.collection === 'pages').updated;
    assert.equal(String(page.layout.da[0].photoSelection), String(page.layout.en[0].photoSelection));
    assert.notEqual(String(page.layout.da[0].photoSelection), String(plan.selections[1]._id));
    assert.equal(plan.changes.find((change) => change.collection === 'media').updated.caption.da, 'Keep me');
    assert.equal(
        queried.some((name) => name.includes('client')),
        false,
    );
    for (const change of plan.changes)
        records[change.collection] = records[change.collection].map((doc) =>
            String(doc._id) === String(change.original._id) ? change.updated : doc,
        );
    const rerun = await planPublicPhotoMigration(db, { EJSON: mongo.BSON.EJSON, ObjectId: mongo.ObjectId });
    assert.equal(rerun.changes.length, 0);
    assert.equal(rerun.selections.length, 0);
});
