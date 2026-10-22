import { composeStories } from '@storybook/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cdp, page, userEvent } from 'vitest/browser';
import * as stories from './DeliveryHero.stories';

// These fixtures exercise the hero controls without an image server or rich-text content.
vi.mock('next/image', () => ({ default: () => null }));
vi.mock('@/components/molecules/admin/RichText', () => ({ default: () => null }));

const { Wedding } = composeStories(stories);

beforeEach(async () => {
    await page.viewport(390, 844);
    await cdp().send('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
    });
});

afterEach(async () => {
    await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe('wedding hero button contrast', () => {
    it('rolls the letters on hover with contrasting text and no button resizing', async () => {
        await Wedding.run();
        const link = page.getByRole('link', { name: 'Se galleriet' });
        const element = link.element();
        const bounds = element.getBoundingClientRect();
        const characters = element.querySelectorAll('.delivery-button-character');
        expect(characters).toHaveLength(12);
        expect(getComputedStyle(element).color).toBe('rgb(250, 255, 239)');
        await link.hover();
        for (const character of characters) {
            await expect
                .poll(() => Math.round(new DOMMatrixReadOnly(getComputedStyle(character).transform).m42))
                .toBe(-Math.round(character.getBoundingClientRect().height));
        }
        expect(getComputedStyle(element).color).toBe('rgb(21, 50, 29)');
        expect(getComputedStyle(element).backgroundColor).toBe('rgb(250, 255, 239)');
        expect(element.getBoundingClientRect().width).toBe(bounds.width);
        expect(element.getBoundingClientRect().height).toBe(bounds.height);
        await cdp().send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 0, y: 0 });
        for (const character of characters) {
            await expect.poll(() => new DOMMatrixReadOnly(getComputedStyle(character).transform).m42).toBe(0);
        }
    });

    it('keeps the same contrast and a visible outline for keyboard focus', async () => {
        await Wedding.run();
        await userEvent.tab();
        const link = page.getByRole('link', { name: 'Se galleriet' });
        await expect.element(link).toHaveFocus();
        await expect.poll(() => getComputedStyle(link.element()).color).toBe('rgb(21, 50, 29)');
        expect(getComputedStyle(link.element()).outlineColor).toBe('rgb(250, 255, 239)');
        for (const character of link.element().querySelectorAll('.delivery-button-character')) {
            await expect
                .poll(() => Math.round(new DOMMatrixReadOnly(getComputedStyle(character).transform).m42))
                .toBe(-Math.round(character.getBoundingClientRect().height));
        }
    });

    it('keeps the label static and readable when reduced motion is enabled', async () => {
        await cdp().send('Emulation.setEmulatedMedia', {
            features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
        });
        await Wedding.run();
        const link = page.getByRole('link', { name: 'Se galleriet', exact: true });
        await link.hover();
        for (const character of link.element().querySelectorAll('.delivery-button-character')) {
            expect(getComputedStyle(character).transform).toBe('none');
            expect(getComputedStyle(character).transitionProperty).toBe('none');
        }
        expect(getComputedStyle(link.element()).color).toBe('rgb(21, 50, 29)');
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
