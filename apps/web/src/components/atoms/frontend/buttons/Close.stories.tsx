import type { Meta, StoryObj } from '@storybook/nextjs';
import { fn } from 'storybook/test';
import Close from './Close';

const meta = {
    title: 'Atoms/Buttons/Close',
    component: Close,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    args: {
        onClick: fn(),
    },
} satisfies Meta<typeof Close>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
