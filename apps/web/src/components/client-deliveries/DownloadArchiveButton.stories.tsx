import type { Meta, StoryObj } from '@storybook/react';
import { themeDefaults, themeStyle } from '@/lib/client-deliveries/theme';
import { DownloadArchiveButton } from './DownloadArchiveButton';
import '@/app/(frontend)/globals.css';
import '@/app/(delivery)/deliveries/delivery.css';

const meta: Meta<typeof DownloadArchiveButton> = {
    title: 'Client galleries/DownloadArchiveButton',
    component: DownloadArchiveButton,
    args: { href: '/deliveries/example/download/archive', byteSize: 2_400_000_000 },
    decorators: [
        (Story) => (
            <div className="delivery-page min-h-48 bg-bg-base p-md text-fg-base" style={themeStyle(themeDefaults)}>
                <Story />
            </div>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {};
export const Disabled: Story = { args: { isDisabled: true } };
