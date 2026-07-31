import type {
    CheckboxField,
    CollapsibleField,
    CollectionSlug,
    GroupField,
    NamedGroupField,
    RadioField,
    RelationshipField,
    TextField,
} from 'payload';
import { routedCollections } from '@/i18n/localized-collections';
import type { Gallery, Page, Post } from '@/payload-types';

type Relation<Slug extends CollectionSlug, T> = {
    relationTo: Slug;
    value: string | T;
} | null;

type RelationSlugMap = {
    pages: Page;
    posts: Post;
    galleries: Gallery;
};

export type PayloadLinkType = {
    type?: ('reference' | 'custom') | null;
    url?: string | null;
    relation?: { [Slug in keyof RelationSlugMap]: Relation<Slug, RelationSlugMap[Slug]> }[keyof RelationSlugMap];
    label?: string | null;
    openNewTab?: boolean | null;
};

export type PayloadLinkInnerProps = {
    required?: boolean;
    localized?: boolean;
    name?: string;
    config?: Omit<NamedGroupField, 'name' | 'type' | 'fields'>;
    hideTitle?: boolean;
};

export const payloadLinkInner = (props: PayloadLinkInnerProps = {}): GroupField => {
    const { required = false, localized = true, name = 'link', config, hideTitle } = props;

    const type: RadioField = {
        type: 'radio',
        name: 'type',
        required: false,
        localized,
        admin: {
            layout: 'vertical',
            width: '25%',
        },
        defaultValue: 'reference',
        options: [
            {
                label: 'Internal link',
                value: 'reference',
            },
            {
                label: 'Custom URL',
                value: 'custom',
            },
        ],
    };

    const openNewTab: CheckboxField = {
        type: 'checkbox',
        name: 'openNewTab',
        label: 'Open new tab',
        localized,
    };

    const linkTitle: TextField = {
        type: 'text',
        name: 'label',
        label: 'Label',
        admin: {
            hidden: hideTitle === true,
        },
        required,
        localized,
    };

    const customUrl: TextField = {
        type: 'text',
        name: 'url',
        label: 'URL',
        required,
        localized,
        admin: {
            condition: (_: unknown, siblingData: { type?: string }) => siblingData?.type === 'custom',
        },
    };

    const reference: RelationshipField = {
        type: 'relationship',
        name: 'relation',
        label: 'Link To',
        relationTo: [...routedCollections],
        required,
        localized,
        admin: {
            condition: (_: unknown, siblingData: { type?: string }) => siblingData?.type === 'reference',
        },
    };

    return {
        type: 'group',
        name,
        label: false,
        ...config,
        admin: {
            hideGutter: true,
            ...config?.admin,
        },
        fields: [
            {
                type: 'row',
                fields: [type, linkTitle, customUrl, reference],
            },
            openNewTab,
        ],
    };
};

export type PayloadLinkProps = {
    label?: string;
    collapsibleAdmin?: CollapsibleField['admin'];
} & PayloadLinkInnerProps;

export const payloadLink = (props: PayloadLinkProps = {}): CollapsibleField => {
    const { required = false, name = 'link', label = 'Link', config, collapsibleAdmin } = props;

    return {
        type: 'collapsible',
        label,
        admin: {
            ...collapsibleAdmin,
        },
        fields: [
            payloadLinkInner({
                required,
                name,
                config,
            }),
        ],
    };
};

export type ConditionalPayloadLinkProps = {
    checkboxName?: string;
    checkboxLabel?: string;
} & PayloadLinkProps;

export const payloadConditionalLink = (props: ConditionalPayloadLinkProps = {}): GroupField => {
    const {
        required = false,
        name = 'link',
        label = 'Link',
        checkboxName = 'addLink',
        checkboxLabel = 'Add Link',
        config,
        collapsibleAdmin,
    } = props;

    return {
        type: 'group',
        label: false,
        fields: [
            {
                type: 'checkbox',
                name: checkboxName,
                label: checkboxLabel,
                localized: true,
            },
            payloadLink({
                required,
                name,
                label,
                config,
                collapsibleAdmin: {
                    ...collapsibleAdmin,
                    condition: (_: unknown, siblingData) => siblingData?.[checkboxName] === true,
                },
            }),
        ],
    };
};
