import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { fn } from 'storybook/test';
import type { Media } from '@/payload-types';
import Lightbox from './Lightbox';

const landscape: Media = {
    id: 'landscape',
    alt: 'Concert stage',
    url: '/images/__mocks__/lightbox-landscape.svg',
    width: 1600,
    height: 900,
    createdAt: '2026-10-15T00:00:00.000Z',
    updatedAt: '2026-10-15T00:00:00.000Z',
};

const portrait: Media = {
    ...landscape,
    id: 'portrait',
    alt: 'Artist portrait',
    url: '/images/__mocks__/lightbox-portrait.svg',
    width: 900,
    height: 1200,
};

const meta = {
    title: 'Molecules/Lightbox',
    component: Lightbox,
    parameters: { layout: 'fullscreen' },
    args: { items: [landscape, portrait], index: 0, onClose: fn(), onNavigate: fn() },
    render: function Viewer(args) {
        const [index, setIndex] = useState(args.index);
        const [isOpen, setIsOpen] = useState(true);
        return isOpen ? (
            <Lightbox {...args} index={index} onNavigate={setIndex} onClose={() => setIsOpen(false)} />
        ) : (
            <span hidden />
        );
    },
} satisfies Meta<typeof Lightbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const SinglePhoto: Story = { args: { items: [portrait] } };
export const ManyPhotos: Story = {
    args: { items: Array.from({ length: 12 }, (_, index) => ({ ...landscape, id: `photo-${index}` })) },
};
