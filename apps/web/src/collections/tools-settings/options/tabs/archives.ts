import {
    MetaDescriptionField,
    MetaImageField,
    MetaTitleField,
    OverviewField,
    PreviewField,
} from '@payloadcms/plugin-seo/fields';
import type { Field } from 'payload';

const createSeoFields = (groupName: string): Field[] => {
    return [
        OverviewField({
            titlePath: `archives.${groupName}.title`,
            descriptionPath: `archives.${groupName}.description`,
            imagePath: `archives.${groupName}.image`,
        }),
        MetaTitleField({
            hasGenerateFn: true,
        }),
        MetaImageField({
            relationTo: 'media',
        }),

        MetaDescriptionField({}),
        PreviewField({
            // if the `generateUrl` function is configured
            hasGenerateFn: true,

            // field paths to match the target field for data
            titlePath: `archives.${groupName}.title`,
            descriptionPath: `archives.${groupName}.description`,
        }),
    ];
};

export const archiveFields: Field[] = [
    {
        type: 'group',
        name: 'postsArchiveMeta',
        label: 'Posts Archive',
        fields: createSeoFields('postsArchiveMeta'),
    },
];
