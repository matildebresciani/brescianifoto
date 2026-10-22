import type { Meta, StoryObj } from '@storybook/react';
import { themeDefaults } from '@/lib/client-deliveries/shared';
import type { DeliveryView } from '@/lib/client-deliveries/view';
import { DeliveryGallery } from './DeliveryGallery';
import lightboxStories from './GalleryLightbox.stories';
import '@/app/(frontend)/globals.css';
import '@/app/(delivery)/deliveries/delivery.css';

const photos = lightboxStories.args.photos;
const first = {
    id: 'first',
    type: 'photos',
    anchor: 'first',
    menuLabel: 'First set',
    photos: photos
        .slice(0, 2)
        .flatMap((photo) => Array.from({ length: 6 }, (_, index) => ({ ...photo, id: `first-${photo.id}-${index}` }))),
    theme: themeDefaults,
    hasCustomColors: false,
} satisfies DeliveryView['blocks'][number];
const second = {
    ...first,
    id: 'second',
    anchor: 'second',
    menuLabel: 'Second set',
    photos: photos
        .slice(2)
        .flatMap((photo) => Array.from({ length: 6 }, (_, index) => ({ ...photo, id: `second-${photo.id}-${index}` }))),
    theme: { ...themeDefaults, background: '#25261F', text: '#FAFFEF' },
};

const gallery: DeliveryView = {
    title: 'Live at the venue',
    coverLayout: 'overlay',
    cover: photos[0],
    desktopColumns: 4,
    photoSpacing: 2,
    overlayColor: themeDefaults.text,
    overlayOpacity: 42,
    alignment: 'center',
    focalX: 50,
    focalY: 50,
    theme: themeDefaults,
    blocks: [first, second],
    archive: { href: '/downloads/archive', byteSize: 2_400_000_000 },
    isPreview: false,
    photoCount: 24,
};

const meta = {
    title: 'Client galleries/Delivery gallery',
    component: DeliveryGallery,
    parameters: { layout: 'fullscreen' },
    args: { gallery },
} satisfies Meta<typeof DeliveryGallery>;

export default meta;
type Story = StoryObj<typeof meta>;
export const WholeGallery: Story = {};
export const EditorialGallery: Story = { args: { gallery: { ...gallery, coverLayout: 'editorial' } } };
