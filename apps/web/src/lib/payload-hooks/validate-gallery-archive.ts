import { type CollectionBeforeChangeHook, ValidationError } from 'payload';
import { z } from 'zod';
import { defaultLocale, isLocale, type Locale, locales } from '@/i18n/localized-collections';

const localizedTextSchema = z.union([z.string(), z.partialRecord(z.enum(locales), z.string().nullish())]).nullish();

const archiveRecordsSchema = z.array(
    z.object({
        id: z.string(),
        slug: localizedTextSchema,
        title: localizedTextSchema,
        hasArchivePage: z.boolean().nullish(),
    }),
);

type LocalizedText = z.infer<typeof localizedTextSchema>;
type ArchiveCollection = 'tags' | 'tag-groups';
type ArchiveDocument = {
    id: string;
    slug?: string | null;
    title?: string | null;
    hasArchivePage?: boolean | null;
};

type ArchiveRecord = z.infer<typeof archiveRecordsSchema>[number];
type ArchiveValidationProps = {
    collection: ArchiveCollection;
    data: Partial<ArchiveDocument>;
    locale: Locale;
    originalId?: string;
    tags: ArchiveRecord[];
    groups: ArchiveRecord[];
};

const localizedValues = (value: LocalizedText): Partial<Record<Locale, string | null | undefined>> => {
    if (typeof value === 'string') return { [defaultLocale]: value };
    return value ?? {};
};

const effectiveText = (value: LocalizedText, locale: Locale): string | undefined => {
    const values = localizedValues(value);
    return values[locale] || values[defaultLocale] || undefined;
};

/** Checks archive requirements and collisions against all effective locale URLs. */
export const getGalleryArchiveValidationErrors = ({
    collection,
    data,
    locale,
    originalId,
    tags,
    groups,
}: ArchiveValidationProps): { path: string; message: string }[] => {
    const ownRecords = collection === 'tags' ? tags : groups;
    const stored = ownRecords.find((record) => record.id === originalId);
    const hasArchivePage = data.hasArchivePage ?? stored?.hasArchivePage ?? false;
    if (collection === 'tag-groups' && !hasArchivePage) return [];

    const slugValues = localizedValues(stored?.slug);
    const titleValues = localizedValues(stored?.title);
    const slug = data.slug === undefined ? slugValues : { ...slugValues, [locale]: data.slug };
    const title = data.title === undefined ? titleValues : { ...titleValues, [locale]: data.title };
    const errors: { path: string; message: string }[] = [];

    for (const archiveLocale of locales) {
        const archiveSlug = effectiveText(slug, archiveLocale);
        if (collection === 'tag-groups') {
            if (!effectiveText(title, archiveLocale)?.trim()) {
                errors.push({
                    path: 'title',
                    message: `A public title is required for ${archiveLocale} (or its default-locale fallback).`,
                });
            }
            if (!archiveSlug?.trim()) {
                errors.push({
                    path: 'slug',
                    message: `An archive slug is required for ${archiveLocale} (or its default-locale fallback).`,
                });
            }
        }
        if (!archiveSlug) continue;

        const hasTagConflict = tags.some(
            (record) =>
                !(collection === 'tags' && record.id === originalId) &&
                effectiveText(record.slug, archiveLocale) === archiveSlug,
        );
        const hasGroupConflict = groups.some(
            (record) =>
                record.hasArchivePage &&
                !(collection === 'tag-groups' && record.id === originalId) &&
                effectiveText(record.slug, archiveLocale) === archiveSlug,
        );

        if (hasTagConflict || hasGroupConflict) {
            errors.push({
                path: 'slug',
                message: `The archive slug "${archiveSlug}" is already used by a tag or public group in ${archiveLocale}.`,
            });
        }
    }
    return errors;
};

/** Validates the shared archive namespace, including slugs inherited through locale fallback. */
export const createGalleryArchiveValidationHook = (
    collection: ArchiveCollection,
): CollectionBeforeChangeHook<ArchiveDocument> => {
    return async ({ data, originalDoc, req }) => {
        const hasArchivePage = data.hasArchivePage ?? originalDoc?.hasArchivePage ?? false;
        if (collection === 'tag-groups' && !hasArchivePage) return data;
        const locale = isLocale(req.locale) ? req.locale : defaultLocale;

        // Read every locale together: changing a default slug can also change untranslated archive URLs.
        // Each child request retains the transaction and context without changing the save's locale.
        // Keep reads sequential because they may share the write's MongoDB transaction.
        const tags = await req.payload.find({
            collection: 'tags',
            locale: 'all',
            fallbackLocale: false,
            depth: 0,
            limit: 0,
            pagination: false,
            select: { slug: true },
            overrideAccess: true,
            req: { ...req },
        });
        const groups = await req.payload.find({
            collection: 'tag-groups',
            locale: 'all',
            fallbackLocale: false,
            depth: 0,
            limit: 0,
            pagination: false,
            select: { slug: true, title: true, hasArchivePage: true },
            overrideAccess: true,
            req: { ...req },
        });

        const errors = getGalleryArchiveValidationErrors({
            collection,
            data,
            locale,
            originalId: originalDoc?.id,
            tags: archiveRecordsSchema.parse(tags.docs),
            groups: archiveRecordsSchema.parse(groups.docs),
        });

        if (errors.length) {
            // Payload requires ValidationError to associate server validation failures with admin fields.
            throw new ValidationError({ collection, errors, req });
        }
        return data;
    };
};
