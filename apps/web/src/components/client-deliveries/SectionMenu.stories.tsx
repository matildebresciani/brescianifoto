import type { Meta, StoryObj } from '@storybook/react';
import { themeDefaults } from '@/lib/client-deliveries/theme';
import { GallerySections as GallerySectionsView } from './GallerySections';
import '@/app/(frontend)/globals.css';
import '@/app/(delivery)/deliveries/delivery.css';

const meta: Meta<typeof GallerySectionsView> = {
    title: 'Client galleries/SectionMenu',
    component: GallerySectionsView,
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
                <Story
                    args={{
                        ...context.args,
                        blocks: context.args.blocks ?? context.args.sections,
                        footer: (
                            <footer className="delivery-footer p-xl">
                                <p className="body-sm">Photographs by Matilde Bresciani</p>
                            </footer>
                        ),
                        children:
                            context.args.children ??
                            context.args.sections.map((section) => (
                                <section
                                    key={section.anchor}
                                    id={section.anchor}
                                    tabIndex={-1}
                                    className="delivery-section min-h-svh text-fg-base"
                                >
                                    <div className="delivery-section-inner">
                                        <h2 className="heading-2">{section.label}</h2>
                                    </div>
                                </section>
                            )),
                    }}
                />
            </div>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const GallerySections: Story = {};
export const WithDownload: Story = {
    args: { archive: { href: '/deliveries/example/download/archive', byteSize: 2_400_000_000 } },
};

export const LongLabels: Story = {
    args: {
        ...WithDownload.args,
        sections: [
            { anchor: 'portraits', label: 'Frederiksberg Have', theme: themeDefaults },
            { anchor: 'family', label: 'Familie og venner', theme: themeDefaults },
        ],
    },
};

export const WithTextSection: Story = {
    args: {
        blocks: [
            { anchor: 'ceremony', theme: themeDefaults },
            { anchor: 'gallery-note', theme: { ...themeDefaults, background: themeDefaults.surface } },
            { anchor: 'after-ceremony', theme: themeDefaults },
        ],
        children: (
            <>
                <section id="ceremony" tabIndex={-1} className="delivery-section min-h-svh">
                    <h2 className="heading-2">Vielsen</h2>
                </section>
                <div id="gallery-note" className="delivery-text-section min-h-svh">
                    <p className="body-md">A note between the photographs.</p>
                </div>
                <section id="after-ceremony" tabIndex={-1} className="delivery-section min-h-svh">
                    <h2 className="heading-2">Efter vielsen</h2>
                </section>
            </>
        ),
    },
};
