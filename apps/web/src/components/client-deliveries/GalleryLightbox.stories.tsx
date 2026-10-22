import type { Meta, StoryObj } from '@storybook/react';
import { resolveSectionTheme, themeDefaults } from '@/lib/client-deliveries/shared';
import type { DeliveryBlock, DeliveryPhoto } from '@/lib/client-deliveries/view';
import { GalleryLightbox } from './GalleryLightbox';
import { PhotoSection } from './PhotoSection';

const stage: DeliveryPhoto = {
    id: 'stage',
    name: 'Concert stage',
    src: '/images/__mocks__/lightbox-landscape.svg',
    imageVersion: 'gallery-lightbox',
    width: 1600,
    height: 900,
    createdAt: '2026-10-22T00:00:00.000Z',
    updatedAt: '2026-10-22T00:00:00.000Z',
    downloadHref: '/downloads/stage',
};
const artist: DeliveryPhoto = {
    ...stage,
    id: 'artist',
    name: 'Artist portrait',
    src: '/images/__mocks__/lightbox-portrait.svg',
    width: 900,
    height: 1200,
    downloadHref: '/downloads/artist',
};
const crowd: DeliveryPhoto = { ...stage, id: 'crowd', name: 'Crowd', downloadHref: undefined };
const first: Extract<DeliveryBlock, { type: 'photos' }> = {
    id: 'first',
    type: 'photos',
    anchor: 'first',
    menuLabel: 'First set',
    photos: [stage, artist],
    theme: themeDefaults,
    hasCustomColors: false,
};
const second: typeof first = {
    ...first,
    id: 'second',
    anchor: 'second',
    menuLabel: 'Second set',
    photos: [crowd, stage],
    ...resolveSectionTheme(themeDefaults, { background: '#25261F', text: '#FAFFEF' }),
};

const meta = {
    title: 'Client galleries/Gallery lightbox',
    component: GalleryLightbox,
    parameters: { layout: 'fullscreen' },
    args: {
        photos: [...first.photos, ...second.photos],
        children: (
            <>
                <PhotoSection block={first} />
                <p className="body-md">Between the sets.</p>
                <PhotoSection block={{ ...first, id: 'empty', anchor: 'empty', photos: [] }} />
                <PhotoSection block={second} />
            </>
        ),
    },
} satisfies Meta<typeof GalleryLightbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MultipleSections: Story = {};
export const SinglePhoto: Story = {
    args: { photos: [artist], children: <PhotoSection block={{ ...first, photos: [artist] }} /> },
};
