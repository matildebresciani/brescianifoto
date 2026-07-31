import type { Navigation } from '@/payload-types';

export const getMainMenuSeed = ({
    page1Id,
    page2Id,
    post1Id,
    post2Id,
}: {
    page1Id: string;
    page2Id: string;
    post1Id: string;
    post2Id: string;
}): Omit<Navigation, 'id' | 'createdAt' | 'updatedAt'> => {
    return {
        title: 'Main Menu',
        position: {
            main: true,
        },
        navItems: [
            {
                link: {
                    type: 'reference',
                    relation: {
                        relationTo: 'pages',
                        value: page1Id,
                    },
                    label: 'Forside',
                },
            },
            {
                link: {
                    type: 'reference',
                    relation: {
                        relationTo: 'pages',
                        value: page2Id,
                    },
                    label: 'Side 2',
                },
            },
            {
                link: {
                    type: 'reference',
                    relation: {
                        relationTo: 'posts',
                        value: post1Id,
                    },
                    label: 'Post 1',
                },
            },
            {
                link: {
                    type: 'reference',
                    relation: {
                        relationTo: 'posts',
                        value: post2Id,
                    },
                    label: 'Post 2',
                },
            },
        ],
    };
};
