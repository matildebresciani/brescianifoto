import type { Meta, StoryObj } from '@storybook/nextjs';
import BaseTextarea from './BaseTextarea';

const meta = {
    title: 'Atoms/Form/BaseTextarea',
    component: BaseTextarea,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    args: {},
} satisfies Meta<typeof BaseTextarea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        placeholder: 'Enter text...',
    },
};
