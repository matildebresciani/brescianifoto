import { createHash } from 'node:crypto';

export const PUBLIC_COLLECTIONS = ['galleries', '_galleries_versions', 'media', 'icons', 'pages', '_pages_versions'];

const isLocalized = (value) =>
    value && typeof value === 'object' && !Array.isArray(value) && ('da' in value || 'en' in value);
const key = (value) => (value?.toHexString ? value.toHexString() : String(value?._id ?? value?.id ?? value));
/** Danish order wins; English-only photos are retained. */
export function mergePhotos(value) {
    if (!isLocalized(value)) return value;
    const result = [];
    const seen = new Set();
    for (const photo of [...(value.da ?? []), ...(value.en ?? [])]) {
        if (!seen.has(key(photo))) {
            result.push(photo);
            seen.add(key(photo));
        }
    }
    return result;
}
export function sharedAlt(value) {
    if (!isLocalized(value)) return value;
    return value.da?.trim() ? value.da : (value.en ?? value.da ?? '');
}

/** Builds a read-only migration plan against raw MongoDB records. Client collections are never queried. */
export async function planPublicPhotoMigration(db, { EJSON, ObjectId }) {
    const changes = [];
    const selections = [];
    const unmatched = [];
    const visibility = [];
    const recoveredGalleries = [];
    // This allowlist deliberately excludes every client collection and version collection.
    for (const name of PUBLIC_COLLECTIONS) {
        for (const original of await db.collection(name).find({}).toArray()) {
            const updated = EJSON.parse(EJSON.stringify(original));
            const data = name.startsWith('_') ? updated.version : updated;
            if (!data) continue;
            if (name.includes('galleries')) {
                if (
                    name === 'galleries' &&
                    isLocalized(data.gallery) &&
                    !data.gallery.da?.length &&
                    data.gallery.en?.length
                )
                    recoveredGalleries.push({ id: key(original._id), photos: data.gallery.en.length });
                data.gallery = mergePhotos(data.gallery);
                if (isLocalized(data.publishStatus) && data.publishStatus.da !== data.publishStatus.en)
                    visibility.push({ collection: name, id: key(original._id), publishStatus: data.publishStatus });
            } else if (name === 'media' || name === 'icons') {
                data.alt = sharedAlt(data.alt);
            } else {
                const layouts = isLocalized(data.layout) ? data.layout : { da: data.layout };
                const groups = new Map();
                for (const locale of ['da', 'en']) {
                    for (const [index, block] of (layouts?.[locale] ?? []).entries()) {
                        if (block.blockType !== 'gallery' || block.photoSelection) continue;
                        const stableId = block._id ?? block.id;
                        const id = stableId ? key(stableId) : `${locale}-${index}`;
                        const group = groups.get(id) ?? [];
                        group.push({ locale, block });
                        groups.set(id, group);
                    }
                }
                for (const [id, group] of groups) {
                    if (group.length === 1) unmatched.push({ page: key(original._id), block: id });
                    const photos = mergePhotos({
                        da: group
                            .filter((item) => item.locale === 'da')
                            .flatMap(({ block }) => mergePhotos(block.gallery) ?? []),
                        en: group
                            .filter((item) => item.locale === 'en')
                            .flatMap(({ block }) => mergePhotos(block.gallery) ?? []),
                    });
                    const selectionId = new ObjectId(
                        createHash('sha256')
                            .update(`${name}:${key(original._id)}:${id}`)
                            .digest('hex')
                            .slice(0, 24),
                    );
                    const first = group[0].block;
                    const selection = {
                        _id: selectionId,
                        name: `${data.name ?? 'Page'} / ${id}`,
                        selectionMode: first.selectionMode ?? 'custom',
                        gallery: photos,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    };
                    selections.push(selection);
                    for (const { block } of group) {
                        block.photoSelection = selectionId;
                        delete block.gallery;
                        delete block.selectionMode;
                    }
                }
            }
            if (EJSON.stringify(original) !== EJSON.stringify(updated))
                changes.push({ collection: name, original, updated });
        }
    }
    return { changes, selections, unmatched, visibility, recoveredGalleries };
}
