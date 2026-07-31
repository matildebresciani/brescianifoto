import { createCollection } from '@/lib/collection-templates/collection';
import { payloadLinkInner } from '@/lib/field-templates/links';
import { anyone } from '../../../access/anyone';

const slug = 'navigation';

export const Navigation = createCollection(slug, {
    access: {
        read: anyone,
    },
    admin: {
        useAsTitle: 'title',
        group: 'Tools & Settings',
        defaultColumns: ['title', 'updatedAt', 'navItems'],
        description: 'Setup menus and navigation globally across your site.',
    },
    labels: {
        singular: 'Menu',
        plural: 'Menus',
    },
    fields: [
        {
            name: 'title',
            type: 'text',
            required: true,
        },
        {
            name: 'navItems',
            type: 'array',
            localized: true,
            fields: [
                payloadLinkInner(),
                {
                    type: 'checkbox',
                    name: 'addSubMenu',
                    label: 'Add Sub Menu',
                },
                {
                    type: 'array',
                    name: 'subMenu',
                    label: 'Sub Menu',
                    fields: [payloadLinkInner()],
                    admin: {
                        condition: (_: unknown, siblingData: { addSubMenu?: boolean }) =>
                            siblingData?.addSubMenu === true,
                    },
                },
            ],
            maxRows: 6,
            admin: {
                components: {
                    RowLabel: '@/collections/tools-settings/navigation/components/RowLabel#RowLabel',
                },
            },
        },
        {
            name: 'position',
            label: 'Menu Position',
            type: 'group',
            admin: {
                position: 'sidebar',
            },
            fields: [
                {
                    name: 'main',
                    type: 'checkbox',
                    label: 'Main Desktop',
                    defaultValue: false,
                },
                {
                    name: 'secondary',
                    type: 'checkbox',
                    label: 'Top Bar',
                    defaultValue: false,
                },
                {
                    name: 'mobile',
                    type: 'checkbox',
                    label: 'Main Mobile',
                    defaultValue: false,
                },
                {
                    name: 'footer1',
                    type: 'checkbox',
                    label: 'Footer Column 1',
                    defaultValue: false,
                },
                {
                    name: 'footer2',
                    type: 'checkbox',
                    label: 'Footer Column 2',
                    defaultValue: false,
                },
                {
                    name: 'footer3',
                    type: 'checkbox',
                    label: 'Footer Column 3',
                    defaultValue: false,
                },
            ],
        },
    ],
});
