import { composeStories } from '@storybook/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cdp, page } from 'vitest/browser';
import * as stories from './SectionMenu.stories';

const { GallerySections } = composeStories(stories);

beforeEach(async () => {
    await page.viewport(1200, 800);
    await cdp().send('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    });
});

afterEach(async () => {
    await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe('delivery section navigation', () => {
    it('keeps the selected section active after scrolling to its anchor offset', async () => {
        await GallerySections.run();
        const last = page.getByRole('link', { name: 'Efter vielsen', exact: true });
        await last.click();
        await expect
            .poll(() => document.getElementById('after-ceremony')?.getBoundingClientRect().top)
            .toBeLessThan(150);
        await expect.element(last).toHaveAttribute('aria-current', 'location');
        const first = page.getByRole('link', { name: 'Vielsen', exact: true });
        await first.click();
        await expect.poll(() => document.getElementById('ceremony')?.getBoundingClientRect().top).toBeLessThan(150);
        await expect.element(first).toHaveAttribute('aria-current', 'location');
    });

    it('selects a short final section even when it cannot reach the sticky navigation', async () => {
        await GallerySections.run();
        const section = document.getElementById('after-ceremony');
        if (!section) throw new Error('Final section is missing');
        section.style.minHeight = '240px';
        await page.getByRole('link', { name: 'Efter vielsen', exact: true }).click();
        await expect.poll(() => document.documentElement.scrollHeight - innerHeight - scrollY).toBeLessThan(2);
        await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        await expect
            .element(page.getByRole('link', { name: 'Efter vielsen', exact: true }))
            .toHaveAttribute('aria-current', 'location');
        await expect
            .poll(() => getComputedStyle(page.getByRole('navigation').element()).backgroundColor)
            .toBe('rgb(250, 255, 239)');
    });
});
