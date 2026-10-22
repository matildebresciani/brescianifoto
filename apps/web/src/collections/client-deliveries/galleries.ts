import { randomBytes, randomUUID } from 'node:crypto';
import { colorPickerField } from '@innovixx/payload-color-picker-field';
import {
    APIError,
    type BlocksFieldValidation,
    type CollectionBeforeValidateHook,
    type CollectionConfig,
    type Field,
    type UploadFieldValidation,
    ValidationError,
    type ValidationFieldError,
    type Where,
} from 'payload';
import { blocks as validateBlocks, upload as validateUpload } from 'payload/shared';
import { z } from 'zod';
import { authenticated } from '@/access/authenticated';
import { normalizeDetails } from '@/lib/client-deliveries/details';
import { deliveryEditor } from '@/lib/client-deliveries/editor';
import { photoSetRevision } from '@/lib/client-deliveries/revision';
import {
    assignPaletteKeys,
    colorLibraryTheme,
    relationshipID,
    resolveSectionTheme,
    sectionColorIssues,
    sectionMenuLabel,
    sectionSchema,
    selectedPhotoIDs,
    themeDefaults,
    themeIssues,
    themeReferenceIssues,
    themeSchema,
} from '@/lib/client-deliveries/shared';

const publishedStatus = z.object({ _status: z.literal('published') });
const validateFeaturedImage: UploadFieldValidation = (value, options) =>
    validateUpload(value, { ...options, required: publishedStatus.safeParse(options.data).success });
const validatePageSections: BlocksFieldValidation = (value, options) =>
    validateBlocks(value, { ...options, required: publishedStatus.safeParse(options.data).success });

const prepareGallery: CollectionBeforeValidateHook = async ({ data, originalDoc, req }) => {
    if (!data) return data;
    const merged = { ...originalDoc, ...data };
    data.shareId = originalDoc?.shareId || randomBytes(24).toString('base64url');
    const previousBlocks: unknown[] = Array.isArray(originalDoc?.blocks) ? originalDoc.blocks : [];
    if (Array.isArray(data.blocks)) {
        data.blocks = data.blocks.map((block: unknown) => {
            const parsed = sectionSchema.safeParse(block);
            const base = z
                .object({ id: z.string().optional(), colors: z.record(z.string(), z.unknown()).nullable().optional() })
                .passthrough()
                .safeParse(block);
            const isExisting =
                base.success &&
                previousBlocks.some(
                    (previous) => z.object({ id: z.string() }).safeParse(previous).data?.id === base.data.id,
                );
            const colors = base.success ? base.data.colors : undefined;
            const nextColors =
                !isExisting && !colors?.textSource && !colors?.text ? { ...colors, textSource: 'inherit' } : colors;
            if (!parsed.success) return base.success ? { ...base.data, colors: nextColors } : block;
            const oldBlock = previousBlocks
                .map((item) => sectionSchema.safeParse(item))
                .find((item) => item.success && item.data.id === parsed.data.id);
            return {
                ...parsed.data,
                menuLabel: (parsed.data.menuLabel ?? parsed.data.title)?.trim(),
                colors: nextColors,
                anchor: oldBlock?.success && oldBlock.data.anchor ? oldBlock.data.anchor : `section-${randomUUID()}`,
            };
        });
    }
    const blocks = data.blocks ?? merged.blocks;
    const themeResult = themeSchema.safeParse({ ...originalDoc?.theme, ...data.theme });
    if (!themeResult.success)
        throw new APIError(
            `Invalid gallery colors: ${themeResult.error.issues.map((issue) => issue.message).join(' ')}`,
            400,
        );
    const theme = assignPaletteKeys(
        colorLibraryTheme(themeResult.data),
        themeSchema.safeParse(originalDoc?.theme ?? {}).data,
    );
    const referenceIssues = themeReferenceIssues(theme);
    if (referenceIssues.length) throw new APIError(referenceIssues.join(' '), 400);
    data.theme = theme;
    for (const [index, block] of (Array.isArray(blocks) ? blocks : []).entries()) {
        const issues = sectionColorIssues(theme, block.colors);
        if (issues.length)
            throw new APIError(`Section ${index + 1} (${sectionMenuLabel(block)}): ${issues.join(' ')}`, 400);
    }
    const ids = selectedPhotoIDs(blocks);
    if (ids.length > 500) throw new APIError('A client gallery supports up to 500 photos.', 400);
    const coverID = relationshipID(merged.cover);
    const allIDs = [...new Set([...ids, ...(coverID ? [coverID] : [])])];
    const photos = allIDs.length
        ? await req.payload.find({
              collection: 'client-photos',
              where: { id: { in: allIDs } },
              depth: 0,
              limit: 501,
              overrideAccess: true,
              req,
          })
        : { docs: [] };
    if (
        photos.docs.length !== allIDs.length ||
        photos.docs.some((photo) => relationshipID(photo.gallery) !== originalDoc?.id)
    ) {
        throw new APIError('Select photos belonging to this client gallery.', 400);
    }
    const revision = photoSetRevision(photos.docs.filter((photo) => ids.includes(photo.id)));
    data.photoRevision = revision;
    const archiveID = relationshipID(merged.archive);
    if (archiveID) {
        const archives = await req.payload.find({
            collection: 'client-downloads',
            where: { id: { equals: archiveID } },
            depth: 0,
            limit: 1,
            overrideAccess: true,
            req,
        });
        const archive = archives.docs[0];
        if (!archive || relationshipID(archive.gallery) !== originalDoc?.id)
            throw new APIError('Select an archive belonging to this gallery.', 400);
        // Confirmation is a one-shot action, never a sticky override for future photo edits.
        data.archiveRevision = merged.confirmArchive
            ? revision
            : archiveID === relationshipID(originalDoc?.archive)
              ? originalDoc?.archiveRevision
              : archive.photoRevision;
    } else {
        data.archiveRevision = null;
    }
    data.confirmArchive = false;
    if (merged._status !== 'published') return data;
    const issues = themeIssues(theme);
    for (const [index, block] of (Array.isArray(blocks) ? blocks : []).entries()) {
        const section = resolveSectionTheme(theme, block.colors);
        const sectionIssues = themeIssues(section.theme);
        if (section.hasCustomColors && sectionIssues.length) {
            issues.push(`Section ${index + 1}: ${sectionIssues.join(' ')}`);
        }
    }
    if (issues.length) throw new APIError(`Improve theme contrast before publishing: ${issues.join(' ')}`, 400);
    const publicationErrors: ValidationFieldError[] = [];
    if (!coverID)
        publicationErrors.push({
            path: 'cover',
            label: 'Featured image',
            message: 'Choose a featured image before publishing. You can save a draft without one.',
        });
    if (!ids.length)
        publicationErrors.push({
            path: 'blocks',
            label: 'Page sections',
            message:
                'Select at least one photo in a Photo section before publishing. You can save a draft without photos.',
        });
    if (!merged.title?.trim())
        publicationErrors.push({ path: 'title', label: 'Title', message: 'Enter a title before publishing.' });
    if (publicationErrors.length)
        throw new ValidationError({ collection: 'client-galleries', errors: publicationErrors, req });
    return data;
};

const sectionColorFields = (): Field[] => [
    {
        name: 'colors',
        label: 'Section colors',
        type: 'group',
        fields: [
            ...['background', 'text'].flatMap((name): Field[] => [
                {
                    name: `${name}Source`,
                    label: name === 'background' ? 'Background color' : 'Text color',
                    type: 'text',
                    // Dynamic token references are validated against the live gallery palette in prepareGallery.
                    admin: {
                        components: {
                            Field: '@/components/molecules/admin/client-deliveries/PaletteSelect#PaletteSelect',
                        },
                    },
                },
                colorPickerField({
                    name,
                    label: `Custom ${name}`,
                    colors: Object.values(themeDefaults),
                    admin: {
                        condition: (_data, siblingData) =>
                            siblingData[`${name}Source`] === 'custom' ||
                            (!siblingData[`${name}Source`] && Boolean(siblingData[name])),
                    },
                    validate: (value: unknown) =>
                        !value || (typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value))
                            ? true
                            : 'Enter a six-digit hex color.',
                }),
            ]),
            {
                name: 'contrast',
                type: 'ui',
                admin: {
                    components: {
                        Field: '@/components/molecules/admin/client-deliveries/SectionColorFeedback#SectionColorFeedback',
                    },
                },
            },
        ],
    },
];

const tokenField = (name: string, label: string, defaultValue?: string): Field => ({
    name,
    label,
    type: 'text',
    defaultValue,
    admin: {
        width: '33.333%',
        components: { Field: '@/components/molecules/admin/client-deliveries/PaletteSelect#PaletteSelect' },
    },
});
const savedHexField = (name: string): Field => ({ name, type: 'text' });
const defaultLibrary = colorLibraryTheme(themeDefaults);
const colorFields: Field[] = [
    {
        name: 'colors',
        type: 'array',
        label: 'Palette colors',
        labels: { singular: 'Color', plural: 'Colors' },
        defaultValue: () => structuredClone(defaultLibrary.colors),
        admin: {
            initCollapsed: true,
            components: {
                RowLabel: '@/components/molecules/admin/client-deliveries/PaletteRowLabel#PaletteRowLabel',
            },
        },
        fields: [
            { name: 'name', type: 'text', admin: { hidden: true } },
            { name: 'key', type: 'text', admin: { hidden: true } },
            colorPickerField({
                name: 'hex',
                label: 'Hex',
                required: true,
                defaultValue: themeDefaults.background,
                colors: Object.values(themeDefaults),
            }),
        ],
    },
    {
        type: 'collapsible',
        label: 'Background',
        admin: { initCollapsed: false },
        fields: [
            {
                type: 'row',
                fields: [
                    tokenField('background', 'bg-base', defaultLibrary.background),
                    tokenField('surface', 'bg-subtle', defaultLibrary.surface),
                    tokenField('bgInvert', 'bg-invert'),
                ],
            },
        ],
    },
    {
        type: 'collapsible',
        label: 'Text',
        admin: { initCollapsed: false },
        fields: [
            {
                type: 'row',
                fields: [
                    tokenField('text', 'fg-base', defaultLibrary.text),
                    tokenField('muted', 'fg-faded', defaultLibrary.muted),
                    tokenField('fgOnColor', 'fg-on-color'),
                ],
            },
        ],
    },
    {
        type: 'collapsible',
        label: 'Border',
        fields: [tokenField('border', 'border-base', defaultLibrary.border)],
    },
    {
        name: 'highlights',
        type: 'array',
        admin: { hidden: true },
        // Retain old references and automatic text choices without exposing pair editing.
        fields: [savedHexField('name'), savedHexField('key'), savedHexField('background'), savedHexField('text')],
    },
];

export const ClientGalleries: CollectionConfig = {
    slug: 'client-galleries',
    access: {
        read: authenticated,
        create: authenticated,
        update: authenticated,
        delete: authenticated,
        readVersions: authenticated,
    },
    admin: {
        group: 'Client delivery',
        useAsTitle: 'name',
        defaultColumns: ['name', 'title', '_status', 'updatedAt'],
        preview: (data) => `/deliveries/${data.shareId}?preview=1`,
        livePreview: { url: ({ data }) => `/deliveries/${data.shareId}?preview=1` },
    },
    versions: { drafts: true, maxPerDoc: 20 },
    hooks: {
        beforeValidate: [prepareGallery],
    },
    fields: [
        { name: 'name', label: 'Internal name', type: 'text', required: true },
        { name: 'title', type: 'text', required: true },
        {
            name: 'shareId',
            label: 'Slug',
            type: 'text',
            unique: true,
            index: true,
            admin: {
                readOnly: true,
                position: 'sidebar',
            },
        },
        {
            name: 'deliveryTools',
            type: 'ui',
            admin: {
                components: { Field: '@/components/molecules/admin/client-deliveries/DeliveryTools#DeliveryTools' },
            },
        },
        {
            type: 'tabs',
            tabs: [
                {
                    label: 'Overview',
                    fields: [
                        {
                            name: 'cover',
                            label: 'Featured image',
                            type: 'upload',
                            required: true,
                            validate: validateFeaturedImage,
                            relationTo: 'client-photos',
                            filterOptions: ({ id }): Where => (id ? { gallery: { equals: id } } : { id: { in: [] } }),
                            admin: {
                                allowCreate: false,
                                components: {
                                    Field: '@/components/molecules/admin/client-deliveries/FeaturedImage#FeaturedImage',
                                },
                            },
                        },
                        { name: 'date', type: 'date', admin: { date: { pickerAppearance: 'dayOnly' } } },
                        { name: 'location', type: 'text' },
                        {
                            name: 'details',
                            type: 'richText',
                            editor: deliveryEditor(),
                            hooks: {
                                afterRead: [({ value }) => normalizeDetails(value)],
                                beforeValidate: [({ value }) => normalizeDetails(value)],
                            },
                        },
                        {
                            type: 'collapsible',
                            label: 'Appearance',
                            admin: { initCollapsed: true },
                            fields: [
                                {
                                    name: 'coverLayout',
                                    label: 'Layout',
                                    type: 'select',
                                    defaultValue: 'editorial',
                                    options: [
                                        { label: 'Text above image', value: 'editorial' },
                                        { label: 'Text over image', value: 'overlay' },
                                    ],
                                    admin: {
                                        description:
                                            'Text over image fills the viewport and places the transparent header over the photograph.',
                                    },
                                },
                                colorPickerField({
                                    name: 'overlayColor',
                                    label: 'Overlay color',
                                    defaultValue: themeDefaults.text,
                                    colors: Object.values(themeDefaults),
                                    admin: {
                                        condition: (data) => data.coverLayout === 'overlay',
                                        description: 'A tint above the photograph, behind the text and header.',
                                    },
                                    validate: (value: unknown) =>
                                        !value || (typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value))
                                            ? true
                                            : 'Enter a six-digit hex color.',
                                }),
                                {
                                    name: 'overlayOpacity',
                                    label: 'Overlay opacity (%)',
                                    type: 'number',
                                    defaultValue: 72,
                                    min: 0,
                                    max: 100,
                                    admin: {
                                        condition: (data) => data.coverLayout === 'overlay',
                                        description: '0 shows the original photograph; 100 is a solid color.',
                                        step: 1,
                                    },
                                },
                                {
                                    name: 'alignment',
                                    type: 'select',
                                    defaultValue: 'center',
                                    options: ['left', 'center', 'right'],
                                },
                            ],
                        },
                        {
                            name: 'focalX',
                            admin: { hidden: true },
                            type: 'number',
                            defaultValue: 50,
                            min: 0,
                            max: 100,
                        },
                        {
                            name: 'focalY',
                            admin: { hidden: true },
                            type: 'number',
                            defaultValue: 50,
                            min: 0,
                            max: 100,
                        },
                    ],
                },
                {
                    label: 'Photo library',
                    fields: [
                        {
                            name: 'photoLibrary',
                            type: 'ui',
                            admin: {
                                components: {
                                    Field: '@/components/molecules/admin/client-deliveries/PhotoLibrary#PhotoLibrary',
                                },
                            },
                        },
                    ],
                },
                {
                    label: 'Page sections',
                    fields: [
                        {
                            name: 'blocks',
                            label: 'Page sections',
                            type: 'blocks',
                            required: true,
                            validate: validatePageSections,
                            blocks: [
                                {
                                    slug: 'text',
                                    labels: { singular: 'Text', plural: 'Text blocks' },
                                    admin: {
                                        components: {
                                            Label: '@/components/molecules/admin/client-deliveries/SectionRowLabel#SectionRowLabel',
                                        },
                                    },
                                    fields: [
                                        {
                                            name: 'content',
                                            type: 'richText',
                                            editor: deliveryEditor(),
                                        },
                                        ...sectionColorFields(),
                                    ],
                                },
                                {
                                    slug: 'photos',
                                    labels: { singular: 'Photo section', plural: 'Photo sections' },
                                    admin: {
                                        components: {
                                            Label: '@/components/molecules/admin/client-deliveries/SectionRowLabel#SectionRowLabel',
                                        },
                                    },
                                    fields: [
                                        // Keep legacy titles readable without presenting a second authoring field.
                                        { name: 'title', type: 'text', admin: { hidden: true } },
                                        {
                                            name: 'menuLabel',
                                            label: 'Menu label',
                                            type: 'text',
                                            required: true,
                                            hooks: {
                                                afterRead: [({ value, siblingData }) => value ?? siblingData.title],
                                            },
                                            admin: {
                                                description:
                                                    'Used in the section menu. Add a visible heading in the introduction using H2.',
                                            },
                                        },
                                        { name: 'anchor', type: 'text', admin: { hidden: true } },
                                        {
                                            name: 'introduction',
                                            label: 'Section introduction',
                                            type: 'richText',
                                            editor: deliveryEditor(),
                                        },
                                        ...sectionColorFields(),
                                        {
                                            name: 'photos',
                                            type: 'upload',
                                            relationTo: 'client-photos',
                                            hasMany: true,
                                            filterOptions: ({ id }): Where =>
                                                id ? { gallery: { equals: id } } : { id: { in: [] } },
                                            admin: {
                                                allowCreate: false,
                                                isSortable: true,
                                                components: {
                                                    Field: '@/components/molecules/admin/photos/GalleryField#GalleryField',
                                                    beforeInput: [
                                                        '@/components/molecules/admin/client-deliveries/PhotoUpload#PhotoUpload',
                                                    ],
                                                },
                                            },
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                {
                    label: 'Colors',
                    fields: [
                        {
                            name: 'theme',
                            type: 'group',
                            hooks: {
                                // Convert legacy palettes before child defaults add the neutral library.
                                afterRead: [
                                    ({ value }) => {
                                        const parsed = themeSchema.safeParse(value ?? {});
                                        return parsed.success ? colorLibraryTheme(parsed.data) : value;
                                    },
                                ],
                            },
                            label: false,
                            fields: colorFields,
                        },
                        {
                            name: 'contrast',
                            type: 'ui',
                            admin: {
                                components: {
                                    Field: '@/components/molecules/admin/client-deliveries/ThemeFeedback#ThemeFeedback',
                                },
                            },
                        },
                    ],
                },
                {
                    label: 'Downloads',
                    fields: [
                        {
                            name: 'canDownloadPhotos',
                            type: 'checkbox',
                            defaultValue: true,
                            label: 'Allow individual original downloads',
                        },
                        {
                            name: 'canDownloadArchive',
                            type: 'checkbox',
                            defaultValue: true,
                            label: 'Show Download all when the ZIP is current',
                        },
                        {
                            name: 'archive',
                            type: 'relationship',
                            relationTo: 'client-downloads',
                            filterOptions: ({ id }) => ({ gallery: { equals: id } }),
                            admin: { allowCreate: false },
                        },
                        {
                            name: 'confirmArchive',
                            type: 'checkbox',
                            label: 'I confirm this ZIP contains exactly the currently selected photos',
                            admin: {
                                description:
                                    'Save to confirm. Changing the selected photos makes the ZIP out of date again.',
                            },
                        },
                        { name: 'photoRevision', type: 'text', admin: { readOnly: true } },
                        { name: 'archiveRevision', type: 'text', admin: { readOnly: true } },
                    ],
                },
            ],
        },
    ],
};
