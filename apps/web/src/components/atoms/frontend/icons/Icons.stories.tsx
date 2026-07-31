import type { Meta, StoryObj } from '@storybook/nextjs';
import ArrowIcon from './ArrowIcon';
import ChevronIcon from './ChrevronIcon';
import PlayIcon from './PlayIcon';
import SearchIcon from './SearchIcon';

const meta = {
    title: 'Atoms/Icons',
    parameters: {
        layout: 'centered',
    },
    args: {},
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const allIcons = {
    Arrow: ArrowIcon,
    Chevron: ChevronIcon,
    PlayIcon: PlayIcon,
    SearchIcon: SearchIcon,
} as const;

export const IconStories: Story = {
    render: (args) => {
        return (
            <div className="grid grid-cols-4 gap-4">
                {Object.entries(allIcons).map(([name, Icon]) => (
                    <Icon key={name} {...args} className="self-center" />
                ))}
            </div>
        );
    },
};
