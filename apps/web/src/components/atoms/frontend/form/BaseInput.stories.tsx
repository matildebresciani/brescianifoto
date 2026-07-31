import type { Meta, StoryObj } from '@storybook/nextjs';
import BaseInput from './BaseInput';

const meta = {
    title: 'Atoms/Form/BaseInput',
    component: BaseInput,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    args: {},
} satisfies Meta<typeof BaseInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        type: 'text',
        placeholder: 'Enter text...',
    },
};
