import type { Meta, StoryObj } from '@storybook/react';
import Embed from './Embed';

const meta: Meta<typeof Embed> = {
    title: 'Organisms/Blocks/Embed',
    component: Embed,
    tags: ['autodocs'],
    args: {
        block: {
            embedCode:
                '<iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ?si=Oru33utVq_vnt3ze" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>',
            blockType: 'embed',
        },
    },
};

export default meta;

type Story = StoryObj<typeof Embed>;

export const Default: Story = {};
