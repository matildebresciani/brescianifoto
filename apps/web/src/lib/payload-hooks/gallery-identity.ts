import { type CollectionBeforeValidateHook, ValidationError } from 'payload';
import { z } from 'zod';
import { formatSlug } from '@/components/molecules/admin/fields/slug/formatSlug';
import { defaultLocale, isLocale, locales } from '@/i18n/localized-collections';
import { formatGalleryIdentity } from '@/lib/utilities/gallery-identity';
import type { Gallery } from '@/payload-types';

const localizedSlugSchema = z.partialRecord(z.enum(locales), z.string().nullish());
const galleryRecordsSchema = z.array(
    z.object({ id: z.string(), slug: z.union([z.string(), localizedSlugSchema]).nullish() }),
);

/** Generates draft show slugs and admin names; public URLs only change after explicitly unlocking. */
export const prepareGalleryIdentity: CollectionBeforeValidateHook<Gallery> = async ({
    data,
    originalDoc,
    operation,
    req,
}) => {
    if (!data) return data;
    const isPublished = operation === 'update' && originalDoc?.publishStatus === 'public';
    const shouldGenerateSlug = (data.slugLock ?? originalDoc?.slugLock ?? true) && !isPublished;
    const shouldGenerateName = !(data.name ?? originalDoc?.name)?.trim();

    if (shouldGenerateSlug || shouldGenerateName) {
        const location = data.location === undefined ? originalDoc?.location : data.location;
        const venue =
            typeof location === 'string'
                ? await req.payload.findByID({
                      collection: 'locations',
                      id: location,
                      depth: 0,
                      overrideAccess: true,
                      req: { ...req },
                  })
                : location;
        const identity = formatGalleryIdentity(
            data.title ?? originalDoc?.title,
            venue?.name,
            data.date === undefined ? originalDoc?.date : data.date,
        );
        if (shouldGenerateSlug) data.slug = identity.slug;
        if (shouldGenerateName) data.name = identity.name;
    }

    if (isPublished && (data.slugLock ?? originalDoc?.slugLock ?? true)) {
        data.slug = originalDoc?.slug;
    }
    if (typeof data.slug === 'string') data.slug = formatSlug(data.slug);
    if ((data.publishStatus ?? originalDoc?.publishStatus) === 'public') data.slugLock = false;
    return data;
};

/** Rejects duplicate gallery URLs, including default-locale slugs inherited by untranslated galleries. */
export const validateGallerySlug: CollectionBeforeValidateHook<Gallery> = async ({
    data,
    originalDoc,
    operation,
    req,
}) => {
    if (!data) return data;
    const slug = data.slug === undefined ? originalDoc?.slug : data.slug;
    if (!slug?.trim() && (data.slug !== undefined || !originalDoc)) {
        // A manual slug must still provide a usable URL; legacy missing slugs can remain untouched.
        throw new ValidationError({
            collection: 'galleries',
            errors: [
                { path: 'slug', message: 'A gallery slug is required. Lock to generate one, or enter a custom slug.' },
            ],
            req,
        });
    }
    const locale = isLocale(req.locale) ? req.locale : defaultLocale;
    const galleries = await req.payload.find({
        collection: 'galleries',
        locale: 'all',
        fallbackLocale: false,
        depth: 0,
        limit: 0,
        pagination: false,
        select: { slug: true },
        overrideAccess: true,
        req: { ...req },
    });
    const records = galleryRecordsSchema.parse(galleries.docs);
    // Payload also supplies originalDoc when duplicating; the source still owns its URLs.
    const originalId = operation === 'update' ? originalDoc?.id : undefined;
    const stored = records.find((gallery) => gallery.id === originalId);
    const storedSlugs = typeof stored?.slug === 'string' ? { [defaultLocale]: stored.slug } : (stored?.slug ?? {});
    const slugs = data.slug === undefined ? storedSlugs : { ...storedSlugs, [locale]: data.slug };
    const errors: { path: string; message: string }[] = [];

    for (const galleryLocale of locales) {
        const slug = slugs[galleryLocale] || slugs[defaultLocale];
        if (!slug) continue;
        const hasConflict = records.some((gallery) => {
            if (gallery.id === originalId) return false;
            const otherSlugs = typeof gallery.slug === 'string' ? { [defaultLocale]: gallery.slug } : gallery.slug;
            return (otherSlugs?.[galleryLocale] || otherSlugs?.[defaultLocale]) === slug;
        });
        if (hasConflict) {
            errors.push({
                path: 'slug',
                message: `The gallery slug "${slug}" is already used in ${galleryLocale}. Add the venue and show date, or unlock and choose a different slug.`,
            });
        }
    }
    if (errors.length) {
        // Payload associates server validation errors with the slug input through this exception.
        throw new ValidationError({ collection: 'galleries', errors, req });
    }
    return data;
};
