import type { Meta, StoryObj } from '@storybook/nextjs';
import BaseLink from './BaseLink';

const meta = {
    title: 'Atoms/Links/BaseLink',
    component: BaseLink,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    args: {},
} satisfies Meta<typeof BaseLink>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        href: '#',
        children: 'Link Text',
    },
};

export const Secondary: Story = {
    args: {
        href: '#',
        theme: 'secondary',
        children: 'Link Text',
    },
};
