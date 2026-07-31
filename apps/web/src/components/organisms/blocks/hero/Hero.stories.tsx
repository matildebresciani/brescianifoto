import type { Meta, StoryObj } from '@storybook/react';
import { richTextMock } from '@/__mocks__/storybook-mocks';
import Hero from './Hero';

const meta: Meta<typeof Hero> = {
    title: 'Organisms/Blocks/Hero',
    component: Hero,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    args: {
        block: {
            blockType: 'hero',
            label: 'Hero Label',
            heading: 'Hero Heading',
            manchet: richTextMock,
        },
    },
};

export default meta;

type Story = StoryObj<typeof Hero>;

export const Default: Story = {};
