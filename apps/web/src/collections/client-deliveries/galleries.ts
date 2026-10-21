import { randomBytes, randomUUID } from 'node:crypto';
import { colorPickerField } from '@innovixx/payload-color-picker-field';
import { FixedToolbarFeature, HeadingFeature, LinkFeature, lexicalEditor } from '@payloadcms/richtext-lexical';
import { APIError, type CollectionBeforeValidateHook, type CollectionConfig, type Field } from 'payload';
import { authenticated } from '@/access/authenticated';
import { photoSetRevision } from '@/lib/client-deliveries/revision';
import {
    paletteOptions,
    relationshipID,
    resolveSectionTheme,
    sectionColorsSchema,
    sectionSchema,
    selectedPhotoIDs,
    themeDefaults,
    themeIssues,
    themeSchema,
} from '@/lib/client-deliveries/shared';

const prepareGallery: CollectionBeforeValidateHook = async ({ data, originalDoc, req }) => {
    if (!data) return data;
    const merged = { ...originalDoc, ...data };
    data.shareId = originalDoc?.shareId || randomBytes(24).toString('base64url');
    const previousBlocks: unknown[] = Array.isArray(originalDoc?.blocks) ? originalDoc.blocks : [];
    if (Array.isArray(data.blocks)) {
        data.blocks = data.blocks.map((block: unknown) => {
            const parsed = sectionSchema.safeParse(block);
            if (!parsed.success) return block;
            const oldBlock = previousBlocks
                .map((item) => sectionSchema.safeParse(item))
                .find((item) => item.success && item.data.id === parsed.data.id);
            return { ...parsed.data, anchor: oldBlock?.success ? oldBlock.data.anchor : `section-${randomUUID()}` };
        });
    }
    const blocks = data.blocks ?? merged.blocks;
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
    const theme = themeSchema.safeParse(merged.theme ?? {});
    if (!theme.success) throw new APIError('Theme colors must be six-digit hex values.', 400);
    const issues = themeIssues(theme.data);
    for (const [index, block] of (Array.isArray(blocks) ? blocks : []).entries()) {
        const colors = sectionColorsSchema.safeParse(block.colors ?? {});
        if (!colors.success)
            throw new APIError(`Section ${index + 1}: use six-digit hex colors or leave them blank.`, 400);
        const section = resolveSectionTheme(theme.data, colors.data);
        const sectionIssues = themeIssues(section.theme);
        if (section.hasCustomColors && sectionIssues.length) {
            issues.push(`Section ${index + 1}: ${sectionIssues.join(' ')}`);
        }
    }
    if (issues.length) throw new APIError(`Improve theme contrast before publishing: ${issues.join(' ')}`, 400);
    if (!coverID || !ids.length || !merged.title?.trim())
        throw new APIError('Publishing requires a title, cover and at least one photo section.', 400);
    return data;
};

// Include all standard text-formatting features, while assets stay in the isolated photo sections.
const deliveryEditor = () =>
    lexicalEditor({
        features: ({ defaultFeatures }) => [
            ...defaultFeatures.filter(({ key }) => !['heading', 'link', 'relationship', 'upload'].includes(key)),
            HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
            LinkFeature({ enabledCollections: [] }),
            FixedToolbarFeature(),
        ],
    });

const sectionColorFields = (): Field[] => [
    {
        name: 'colors',
        label: 'Section colors',
        type: 'group',
        admin: {
            description:
                'Choose a gallery palette color so this section follows palette changes, or set a custom color.',
        },
        fields: [
            ...['background', 'text'].flatMap((name): Field[] => [
                {
                    name: `${name}Source`,
                    label: name === 'background' ? 'Background color' : 'Text color',
                    type: 'select',
                    // No default: older documents must retain their existing custom hex values.
                    options: [
                        { label: 'Inherit gallery color', value: 'inherit' },
                        ...paletteOptions,
                        { label: 'Custom color', value: 'custom' },
                    ],
                    admin: { isClearable: true, placeholder: 'Keep existing color / inherit' },
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

const colorFields: Field[] = Object.entries(themeDefaults).map(([name, defaultValue]) =>
    colorPickerField({
        name,
        label: paletteOptions.find((option) => option.value === name)?.label ?? name,
        defaultValue,
        colors: Object.values(themeDefaults),
        validate: (value: unknown) =>
            typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? true : 'Enter a six-digit hex color.',
    }),
);

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
        description:
            'Unlisted delivery links. Save a draft first, then upload photos and build sections. Anyone with a link can share it.',
        preview: (data) => `/deliveries/${data.shareId}?preview=1`,
        livePreview: { url: ({ data }) => `/deliveries/${data.shareId}?preview=1` },
    },
    versions: { drafts: true, maxPerDoc: 20 },
    hooks: { beforeValidate: [prepareGallery] },
    fields: [
        { name: 'name', label: 'Internal name', type: 'text', required: true },
        { name: 'title', type: 'text', required: true },
        { name: 'shareId', type: 'text', unique: true, index: true, admin: { readOnly: true, position: 'sidebar' } },
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
                    label: 'Cover',
                    fields: [
                        {
                            name: 'cover',
                            type: 'upload',
                            relationTo: 'client-photos',
                            filterOptions: ({ id }) => ({ gallery: { equals: id } }),
                            admin: {
                                allowCreate: false,
                                description:
                                    'The large image at the top of the delivery page. Upload a JPEG here or choose a photo already in this gallery.',
                                components: {
                                    beforeInput: [
                                        '@/components/molecules/admin/client-deliveries/PhotoUpload#PhotoUpload',
                                    ],
                                },
                            },
                        },
                        {
                            name: 'coverLayout',
                            type: 'select',
                            defaultValue: 'editorial',
                            options: [
                                { label: 'Text above image', value: 'editorial' },
                                { label: 'Text over image', value: 'overlay' },
                            ],
                        },
                        {
                            name: 'alignment',
                            type: 'select',
                            defaultValue: 'center',
                            options: ['left', 'center', 'right'],
                        },
                        { name: 'subtitle', type: 'text' },
                        { name: 'date', type: 'date', admin: { date: { pickerAppearance: 'dayOnly' } } },
                        { name: 'location', type: 'text' },
                        { name: 'details', type: 'textarea' },
                        {
                            name: 'focalX',
                            label: 'Horizontal focal point (%)',
                            type: 'number',
                            defaultValue: 50,
                            min: 0,
                            max: 100,
                        },
                        {
                            name: 'focalY',
                            label: 'Vertical focal point (%)',
                            type: 'number',
                            defaultValue: 50,
                            min: 0,
                            max: 100,
                        },
                    ],
                },
                {
                    label: 'Page sections',
                    fields: [
                        {
                            name: 'blocks',
                            type: 'blocks',
                            blocks: [
                                {
                                    slug: 'text',
                                    labels: { singular: 'Text', plural: 'Text blocks' },
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
                                    fields: [
                                        { name: 'title', type: 'text', required: true },
                                        { name: 'menuLabel', type: 'text' },
                                        { name: 'anchor', type: 'text', admin: { hidden: true } },
                                        {
                                            name: 'introduction',
                                            label: 'Section introduction',
                                            type: 'richText',
                                            editor: deliveryEditor(),
                                            admin: {
                                                description:
                                                    'Optional rich text displayed above this section’s photographs.',
                                            },
                                        },
                                        ...sectionColorFields(),
                                        {
                                            name: 'photos',
                                            type: 'upload',
                                            relationTo: 'client-photos',
                                            hasMany: true,
                                            filterOptions: ({ id }) => ({ gallery: { equals: id } }),
                                            admin: {
                                                allowCreate: false,
                                                isSortable: true,
                                                description:
                                                    'Upload here or choose existing gallery photos. Drag selected photos to reorder. Removing a selection keeps the original in the gallery library.',
                                                components: {
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
                            admin: {
                                description:
                                    'Click a hex field to open its color picker. The swatch shows the selected color.',
                            },
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
                                    'Save after checking. This confirmation applies only to this photo revision; future photo changes hide Download all again.',
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
