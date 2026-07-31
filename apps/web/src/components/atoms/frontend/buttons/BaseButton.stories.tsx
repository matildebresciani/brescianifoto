import type { Meta, StoryObj } from '@storybook/nextjs';
import { fn } from 'storybook/test';
import BaseButton from './BaseButton';

const meta = {
    title: 'Atoms/Buttons/BaseButton',
    component: BaseButton,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    args: {
        onClick: fn(),
    },
} satisfies Meta<typeof BaseButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        theme: 'primary',
        children: 'Button Text',
    },
};
export const Secondary: Story = {
    args: {
        theme: 'secondary',
        children: 'Button Text',
    },
};
