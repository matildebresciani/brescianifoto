import type { Meta, StoryObj } from '@storybook/react';
import Divider from './Divider';

const meta: Meta<typeof Divider> = {
    title: 'Organisms/Blocks/Divider',
    component: Divider,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    args: {
        block: {
            blockType: 'divider',
            showLine: true,
            size: 'medium',
        },
    },
};

export default meta;

type Story = StoryObj<typeof Divider>;

export const Default: Story = {
    render: (args) => (
        <div className="h-[200px] w-[500px]">
            <Divider {...args} />
        </div>
    ),
};
