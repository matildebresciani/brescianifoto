import type { Meta, StoryObj } from '@storybook/react';
import { themeDefaults, themeStyle } from '@/lib/client-deliveries/theme';
import { DeliveryHero } from './DeliveryHero';
import '@/app/(frontend)/globals.css';
import '@/app/(delivery)/deliveries/delivery.css';

const theme = { ...themeDefaults, background: '#E9E9C7', text: '#15321D', bgInvert: '#30673A', fgOnColor: '#E9E9C7' };
const meta: Meta<typeof DeliveryHero> = {
    title: 'Client galleries/DeliveryHero',
    component: DeliveryHero,
    args: {
        gallery: {
            title: 'Andrea & Emil',
            date: '2026-10-17',
            coverLayout: 'overlay',
            desktopColumns: 4,
            photoSpacing: 4,
            overlayColor: theme.text,
            overlayOpacity: 42,
            alignment: 'center',
            focalX: 50,
            focalY: 5,
            theme,
            blocks: [],
            isPreview: false,
            photoCount: 220,
        },
    },
    decorators: [
        (Story) => (
            <div className="delivery-page" style={themeStyle(theme)}>
                <Story />
            </div>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof meta>;
export const Wedding: Story = {};
