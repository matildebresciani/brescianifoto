import { composeStories } from '@storybook/react';
import type { ComponentProps } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cdp, page, userEvent } from 'vitest/browser';
import * as stories from './DeliveryHero.stories';

vi.mock('next/image', () => ({
    __esModule: true,
    default: ({ quality, preload, ...props }: ComponentProps<'img'> & { quality?: number; preload?: boolean }) => (
        // biome-ignore lint/performance/noImgElement: Exercise cover geometry without a Next.js image server.
        <img {...props} alt={props.alt} data-image-quality={quality} data-image-preload={preload} />
    ),
}));
vi.mock('@/components/molecules/admin/RichText', () => ({ default: () => null }));

const { Wedding, LandscapeCover, PortraitCover, EditorialCover } = composeStories(stories);

async function expectCoverResolution() {
    await expect
        .poll(() => {
            const image = document.querySelector<HTMLImageElement>('.delivery-cover');
            const frame = document.querySelector('.delivery-cover-frame');
            if (!image || !frame) return false;
            const bounds = frame.getBoundingClientRect();
            const requestedWidth = Number.parseFloat(image.sizes);
            const ratio = Number(image.getAttribute('width')) / Number(image.getAttribute('height'));
            return requestedWidth >= bounds.width * 1.04 && requestedWidth / ratio >= bounds.height * 1.04;
        })
        .toBe(true);
}

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
    it('requests enough detail for a tall phone cover and remeasures on rotation and content growth', async () => {
        await page.viewport(393, 852);
        await LandscapeCover.run();
        await expectCoverResolution();
        const image = document.querySelector<HTMLImageElement>('.delivery-cover');
        if (!image) throw new Error('Cover image missing');
        expect(Number.parseFloat(image.sizes) * 3).toBeGreaterThan(3500);
        expect(image.getAttribute('data-image-quality')).toBe('90');
        expect(image.getAttribute('data-image-preload')).toBe('true');
        expect(image.style.objectPosition).toBe('50% 5%');

        await page.viewport(852, 393);
        await expectCoverResolution();
        const copy = document.querySelector<HTMLElement>('.delivery-hero-copy');
        if (!copy) throw new Error('Hero copy missing');
        copy.style.minHeight = '1400px';
        await expectCoverResolution();
    });

    it('sizes portrait covers for their full crop', async () => {
        await PortraitCover.run();
        await expectCoverResolution();
    });

    it('sizes editorial covers for their capped height on phone and desktop', async () => {
        await EditorialCover.run();
        await expectCoverResolution();
        await page.viewport(1440, 1800);
        await expectCoverResolution();
    });
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
