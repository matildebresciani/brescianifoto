import type { Meta, StoryObj } from '@storybook/nextjs';
import { richTextMock } from '@/__mocks__/storybook-mocks';
import Paragraph from './Paragraph';

const meta = {
    title: 'Organisms/Blocks/Paragraph',
    component: Paragraph,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    args: {},
} satisfies Meta<typeof Paragraph>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        pageId: '1',
        block: {
            blockType: 'paragraph',
            richText: richTextMock,
        },
    },
};
