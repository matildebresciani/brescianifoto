import type { Meta, StoryObj } from '@storybook/react';
import { themeDefaults, themeStyle } from '@/lib/client-deliveries/theme';
import { SectionMenu } from './SectionMenu';
import '@/app/(frontend)/globals.css';
import '@/app/(delivery)/deliveries/delivery.css';

const meta: Meta<typeof SectionMenu> = {
    title: 'Client galleries/SectionMenu',
    component: SectionMenu,
    parameters: { layout: 'fullscreen' },
    args: {
        sections: [
            {
                anchor: 'ceremony',
                label: 'Vielsen',
                theme: {
                    ...themeDefaults,
                    background: themeDefaults.text,
                    text: themeDefaults.background,
                    muted: themeDefaults.background,
                },
            },
            { anchor: 'after-ceremony', label: 'Efter vielsen', theme: themeDefaults },
        ],
        archive: undefined,
        theme: themeDefaults,
    },
    decorators: [
        (Story, context) => (
            <div className="delivery-page">
                <Story />
                <main>
                    {context.args.sections.map((section) => (
                        <section
                            key={section.anchor}
                            id={section.anchor}
                            tabIndex={-1}
                            className="delivery-section min-h-svh bg-bg-base text-fg-base"
                            style={themeStyle(section.theme)}
                        >
                            <div className="delivery-section-inner">
                                <h2 className="heading-2">{section.label}</h2>
                            </div>
                        </section>
                    ))}
                </main>
            </div>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const GallerySections: Story = {};
