import type { Block } from 'payload';
import { Embed } from '@/collections/embed/config';
import { Divider } from '@/components/organisms/blocks/divider/config';
import { Paragraph } from '@/components/organisms/blocks/paragraph/config';
import { SavedLayoutsBlock } from '@/components/organisms/blocks/saved-layouts/config';
import { createRoutedCollection } from '@/lib/collection-templates/routed-collection';
import { payloadSEO } from '@/lib/field-templates/seo';

const slug = 'posts';
const blocks: Block[] = [Divider, Embed, Paragraph, SavedLayoutsBlock];

export const Posts = createRoutedCollection(slug, {
    defaultPopulate: {
        title: true,
        slug: true,
        categories: true,
    },
    admin: {
        defaultColumns: ['name', 'title', 'slug', 'updatedAt', 'publishStatus'],
        group: 'Content',
    },
    fields: [
        {
            type: 'tabs',
            tabs: [
                {
                    fields: [
                        {
                            name: 'layout',
                            type: 'blocks',
                            localized: true,
                            blocks,
                            admin: {
                                initCollapsed: false,
                            },
                        },
                    ],
                    label: 'Content',
                },
                {
                    fields: [
                        {
                            name: 'relatedPosts',
                            type: 'relationship',
                            admin: {
                                position: 'sidebar',
                            },
                            filterOptions: ({ id }) => {
                                return {
                                    id: {
                                        not_in: [id],
                                    },
                                };
                            },
                            hasMany: true,
                            relationTo: slug,
                        },
                        {
                            name: 'categories',
                            type: 'relationship',
                            admin: {
                                position: 'sidebar',
                            },
                            hasMany: true,
                            relationTo: 'post-categories',
                        },
                    ],
                    label: 'Meta',
                },
                payloadSEO,
            ],
        },
    ],
});
