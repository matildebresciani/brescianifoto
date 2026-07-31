import type { Meta, StoryObj } from '@storybook/react';
import { richTextMock } from '@/__mocks__/storybook-mocks';
import Accordion from './Accordion';

const meta: Meta<typeof Accordion> = {
    title: 'Molecules/Accordion',
    component: Accordion,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    args: {
        title: 'Accordion Title',
        content: richTextMock,
    },
};

export default meta;

type Story = StoryObj<typeof Accordion>;

export const Default: Story = {};
