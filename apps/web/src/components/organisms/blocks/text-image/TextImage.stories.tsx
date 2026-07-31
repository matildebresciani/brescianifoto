import type { Meta, StoryObj } from '@storybook/nextjs';
import { imageMock, richTextMock } from '@/__mocks__/storybook-mocks';
import TextImage from './TextImage';

const meta = {
    title: 'Organisms/Blocks/TextImage',
    component: TextImage,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    args: {},
} satisfies Meta<typeof TextImage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        pageId: '1337',
        block: {
            blockType: 'text-image',
            order: 'image-left',
            image: imageMock,
            richText: richTextMock,
            addLink: true,
            link: {
                url: 'https://example.com',
                label: 'Example Link',
            },
        },
    },
    render: (args) => <TextImage {...args} />,
};
