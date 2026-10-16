import type { Meta, StoryObj } from '@storybook/nextjs';
import { imageMock, richTextMock } from '@/__mocks__/storybook-mocks';
import { portfolioPageContent } from '@/lib/utilities/portfolio-page-content';
import TextImage from './TextImage';

const meta = {
    title: 'Organisms/Blocks/TextImage',
    component: TextImage,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    args: { locale: 'da' },
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
                type: 'custom',
                url: '/contact',
                label: 'Get in touch',
            },
        },
    },
    render: (args) => <TextImage {...args} />,
};

export const About: Story = {
    args: {
        ...Default.args,
        block: { ...Default.args.block, richText: portfolioPageContent('About') },
    },
};

export const ImageRight: Story = {
    args: {
        ...Default.args,
        block: { ...Default.args.block, order: 'image-right' },
    },
};

export const WithoutLink: Story = {
    args: {
        ...Default.args,
        block: { ...Default.args.block, addLink: false },
    },
};

export const NewTab: Story = {
    args: {
        ...Default.args,
        block: {
            ...Default.args.block,
            link: { type: 'custom', url: 'https://example.com', label: 'View publication', openNewTab: true },
        },
    },
};
