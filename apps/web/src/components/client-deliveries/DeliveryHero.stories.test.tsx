import { composeStories } from '@storybook/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cdp, page, userEvent } from 'vitest/browser';
import * as stories from './DeliveryHero.stories';

// These fixtures exercise the hero controls without an image server or rich-text content.
vi.mock('next/image', () => ({ default: () => null }));
vi.mock('@/components/molecules/admin/RichText', () => ({ default: () => null }));

const { Wedding } = composeStories(stories);

beforeEach(async () => {
    await page.viewport(390, 844);
});

describe('wedding hero button contrast', () => {
    it('uses dark text on the pale hover fill instead of the pale page background', async () => {
        await Wedding.run();
        const link = page.getByRole('link', { name: 'Se galleriet' });
        expect(getComputedStyle(link.element()).color).toBe('rgb(250, 255, 239)');
        await link.hover();
        await expect.poll(() => getComputedStyle(link.element()).color).toBe('rgb(21, 50, 29)');
        await expect.poll(() => getComputedStyle(link.element()).backgroundColor).toBe('rgb(250, 255, 239)');
    });

    it('keeps the same contrast and a visible outline for keyboard focus', async () => {
        await Wedding.run();
        await userEvent.tab();
        const link = page.getByRole('link', { name: 'Se galleriet' });
        await expect.element(link).toHaveFocus();
        await expect.poll(() => getComputedStyle(link.element()).color).toBe('rgb(21, 50, 29)');
        expect(getComputedStyle(link.element()).outlineColor).toBe('rgb(250, 255, 239)');
    });

    it('keeps dark text on the pale fill while pressed', async () => {
        await Wedding.run();
        const element = page.getByRole('link', { name: 'Se galleriet' }).element();
        const bounds = element.getBoundingClientRect();
        await cdp().send('Input.dispatchMouseEvent', {
            type: 'mousePressed',
            button: 'left',
            buttons: 1,
            clickCount: 1,
            x: bounds.x + bounds.width / 2,
            y: bounds.y + bounds.height / 2,
        });
        try {
            expect(element.matches(':active')).toBe(true);
            await expect.poll(() => getComputedStyle(element).color).toBe('rgb(21, 50, 29)');
            await expect.poll(() => getComputedStyle(element).backgroundColor).toBe('rgb(250, 255, 239)');
        } finally {
            await cdp().send('Input.dispatchMouseEvent', {
                type: 'mouseReleased',
                button: 'left',
                buttons: 0,
                clickCount: 1,
                x: 0,
                y: 0,
            });
        }
    });
});
