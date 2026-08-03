import type { Meta, StoryObj } from '@storybook/react';
import type { Media } from '@/payload-types';
import Gallery from './Gallery';

const image = (id: string, filename: string, width: number, height: number): Media => ({
    id,
    alt: '',
    url: `/uploads/media/${filename}`,
    filename,
    mimeType: 'image/jpeg',
    filesize: 0,
    width,
    height,
    createdAt: '2025-10-17T00:00:00.000Z',
    updatedAt: '2025-10-17T00:00:00.000Z',
});

const images: Media[] = [
    image('1', '26.06.26_NECKBREAKKER_COPENHELL_Matilde-Bresciani-14-900x600.jpg', 900, 600),
    image('2', '26.06.26_NECKBREAKKER_COPENHELL_Matilde-Bresciani-6-900x1200.jpg', 900, 1200),
    image('3', '26.06.26_NECKBREAKKER_COPENHELL_Matilde-Bresciani-16-900x600.jpg', 900, 600),
    image('4', '26.06.26_NECKBREAKKER_COPENHELL_Matilde-Bresciani-17-900x1200.jpg', 900, 1200),
    image('5', '26.06.26_NECKBREAKKER_COPENHELL_Matilde-Bresciani-27-900x600.jpg', 900, 600),
    image('6', '26.06.26_NECKBREAKKER_COPENHELL_Matilde-Bresciani-22-900x1200.jpg', 900, 1200),
    image('7', '26.06.26_NECKBREAKKER_COPENHELL_Matilde-Bresciani-8-900x600.jpg', 900, 600),
    image('8', '26.06.26_NECKBREAKKER_COPENHELL_Matilde-Bresciani-23-900x1200.jpg', 900, 1200),
    image('9', '26.06.26_NECKBREAKKER_COPENHELL_Matilde-Bresciani-13-900x600.jpg', 900, 600),
];

const meta: Meta<typeof Gallery> = {
    title: 'Molecules/Gallery',
    component: Gallery,
    parameters: {
        layout: 'fullscreen',
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Gallery>;

export const Default: Story = {
    args: {
        images,
    },
};

export const Empty: Story = {
    args: {
        images: [],
    },
};
