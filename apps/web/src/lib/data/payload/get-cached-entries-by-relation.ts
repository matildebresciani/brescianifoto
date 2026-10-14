import type { CollectionSlug, TypedCollectionSelect } from 'payload';
import { getCachedEntriesByIds } from './get-cached-entries-by-ids';

type Props<C extends CollectionSlug> = {
    relations: {
        relationTo: C;
        value: string | { id: string };
    }[];
    select?: TypedCollectionSelect[C];
};

export const getCachedEntriesByRelation = async <C extends CollectionSlug>(props: Props<C>) => {
    const { relations, select } = props;
    const collectionIdMap: Map<C, string[]> = new Map();

    relations.forEach(({ relationTo, value }) => {
        const id = typeof value === 'string' ? value : value.id;
        if (!collectionIdMap.has(relationTo)) {
            collectionIdMap.set(relationTo, []);
        }
        collectionIdMap.get(relationTo)?.push(id);
    });

    const populatedEntries = await Promise.all(
        Array.from(collectionIdMap.entries()).map(async ([collection, ids]) => {
            const entries = await getCachedEntriesByIds({
                collection,
                ids,
                select,
            });
            return [collection, entries || []] as const;
        }),
    );

    const resultsFlattened = populatedEntries.flatMap(([collection, entries]) => {
        return entries.map((entry) => ({
            entry,
            collection,
        }));
    });

    const resultsSortedById = relations
        .map(({ relationTo, value }) => {
            const id = typeof value === 'string' ? value : value.id;
            return resultsFlattened.find((item) => item.collection === relationTo && item.entry.id === id);
        })
        .filter((item) => item !== undefined);

    return resultsSortedById;
};
