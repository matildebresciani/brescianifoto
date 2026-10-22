import type { Meta, StoryObj } from '@storybook/react';
import { themeDefaults, themeStyle } from '@/lib/client-deliveries/theme';
import type { DeliveryPhoto } from '@/lib/client-deliveries/view';
import { DeliveryHero } from './DeliveryHero';
import '@/app/(frontend)/globals.css';
import '@/app/(delivery)/deliveries/delivery.css';

const theme = { ...themeDefaults, background: '#E9E9C7', text: '#15321D', bgInvert: '#30673A', fgOnColor: '#E9E9C7' };
const meta = {
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
} satisfies Meta<typeof DeliveryHero>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Wedding: Story = {};

const cover: DeliveryPhoto = {
    id: 'hero-photo',
    src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="4549" height="3412"%3E%3Crect width="100%25" height="100%25" fill="%2325261F"/%3E%3C/svg%3E',
    width: 4549,
    height: 3412,
    name: 'Cover photograph',
    imageVersion: '1',
    createdAt: '2026-10-23',
    updatedAt: '2026-10-23',
};

export const LandscapeCover: Story = { args: { gallery: { ...meta.args.gallery, cover } } };
export const PortraitCover: Story = {
    args: { gallery: { ...meta.args.gallery, cover: { ...cover, width: 3412, height: 4549 } } },
};
export const EditorialCover: Story = {
    args: { gallery: { ...meta.args.gallery, cover, coverLayout: 'editorial' } },
};
