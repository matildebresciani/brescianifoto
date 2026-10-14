import type { TextField } from 'payload';

export const paylaodPageName: TextField = {
    name: 'name',
    label: 'Page Name',
    type: 'text',
    required: true,
    admin: {
        description: 'This is the name of the page, it will only be used in the admin panel. And is not localized.',
    },
};

export const payloadTitle: TextField = {
    name: 'title',
    type: 'text',
    required: true,
    localized: true,
    admin: {
        description: 'This title will be used in references and will set the slug.',
    },
};

export const payloadTitleCollection = [paylaodPageName, payloadTitle] as const;
