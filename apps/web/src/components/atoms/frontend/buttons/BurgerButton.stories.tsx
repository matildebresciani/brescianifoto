import type { Meta, StoryObj } from '@storybook/nextjs';
import { fn } from 'storybook/test';
import BurgerButton from './BurgerButton';

const meta = {
    title: 'Atoms/Buttons/BurgerButton',
    component: BurgerButton,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    args: {
        onClick: fn(),
    },
} satisfies Meta<typeof BurgerButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        isOpen: false,
    },
};
