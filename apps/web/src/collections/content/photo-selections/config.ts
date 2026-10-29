import type { CollectionConfig } from 'payload';
import { anyone } from '@/access/anyone';
import { authenticated } from '@/access/authenticated';
import { payloadGallery } from '@/lib/field-templates/images';
import { revalidatePortfolioMedia } from '@/lib/payload-hooks/revalidate-portfolio-media';

/** Shared photo selections used by public page blocks in every locale. */
export const PhotoSelections: CollectionConfig = {
    slug: 'photo-selections',
    admin: { group: 'Content', useAsTitle: 'name' },
    access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
    hooks: { afterChange: [revalidatePortfolioMedia], afterDelete: [revalidatePortfolioMedia] },
    versions: { maxPerDoc: 50 },
    fields: [
        { name: 'name', type: 'text', required: true },
        {
            name: 'selectionMode',
            type: 'select',
            defaultValue: 'random',
            required: true,
            options: [
                { label: 'Random', value: 'random' },
                { label: 'Custom', value: 'custom' },
            ],
        },
        payloadGallery({ localized: false }),
    ],
};
