import type { Meta, StoryObj } from '@storybook/react';
import { themeDefaults } from '@/lib/client-deliveries/theme';
import type { DeliveryBlock, DeliveryPhoto } from '@/lib/client-deliveries/view';
import { GalleryLightbox } from './GalleryLightbox';
import { PhotoSection } from './PhotoSection';
import '@/app/(frontend)/globals.css';
import '@/app/(delivery)/deliveries/delivery.css';

const photos = Array.from({ length: 17 }, (_, index): DeliveryPhoto => {
    const width = [900, 1600, 1000][index % 3] ?? 1000;
    const height = [1200, 900, 1000][index % 3] ?? 1000;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="${index % 2 ? '#55584C' : '#25261F'}"/><text x="50%" y="50%" text-anchor="middle" fill="#FAFFEF" font-size="100">${index + 1}</text></svg>`;
    return {
        id: `photo-${index}`,
        src: `data:image/svg+xml,${encodeURIComponent(svg)}`,
        imageVersion: '1',
        name: `Photo ${index + 1}`,
        width,
        height,
        createdAt: '2026-10-22T00:00:00.000Z',
        updatedAt: '2026-10-22T00:00:00.000Z',
        downloadHref: `/test-original/photo-${index}.jpg`,
    };
});

const block: Extract<DeliveryBlock, { type: 'photos' }> = {
    id: 'photos',
    type: 'photos',
    anchor: 'photos',
    menuLabel: 'Concert photographs',
    theme: themeDefaults,
    hasCustomColors: false,
    photos,
};

const meta: Meta<typeof PhotoSection> = {
    title: 'Client galleries/PhotoSection',
    component: PhotoSection,
    parameters: { layout: 'fullscreen' },
    decorators: [
        (Story, context) => (
            <div className="delivery-page delivery-content">
                <GalleryLightbox photos={context.args.block.photos}>
                    <Story />
                </GalleryLightbox>
            </div>
        ),
    ],
    args: { block },
};
export default meta;
type Story = StoryObj<typeof meta>;

export const MixedPhotos: Story = {};
export const SinglePhoto: Story = {
    args: { block: { ...block, photos: photos.slice(0, 1) } },
};
export const ManyPhotos: Story = {
    args: {
        block: {
            ...block,
            photos: Array.from({ length: 30 }, () => photos)
                .flat()
                .slice(0, 500)
                .map((photo, index) => ({
                    ...photo,
                    id: `many-${index}`,
                    name: `Photo ${index + 1}`,
                })),
        },
    },
};
