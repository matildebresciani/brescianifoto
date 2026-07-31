import type { Field } from 'payload';

export const scriptFields: Field[] = [
    {
        name: 'scriptInjection',
        label: 'Script Injection',
        type: 'group',
        admin: {
            description:
                'Be careful. Scripts have a direct influence on how the site performs. Only edit this page, if you know what you are doing.',
        },
        fields: [
            {
                type: 'text',
                name: 'gtmId',
                label: 'Google Tag Manager ID',
                admin: {
                    description: 'The ID for your Google Tag Manager container. Example: GTM-XXXXXXXX',
                },
            },
            {
                name: 'headScript',
                type: 'code',
                label: 'Scripts in <head>',
            },
            {
                name: 'bodyScript',
                type: 'code',
                label: 'Scripts in opening <body>',
            },
            {
                name: 'footerScript',
                type: 'code',
                label: 'Scripts in closing </body>',
            },
        ],
    },
];
