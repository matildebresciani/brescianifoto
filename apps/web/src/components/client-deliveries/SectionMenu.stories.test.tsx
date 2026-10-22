import { composeStories } from '@storybook/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cdp, page, userEvent } from 'vitest/browser';
import * as stories from './SectionMenu.stories';

const { GallerySections, WithTextSection, WithDownload, LongLabels } = composeStories(stories);

function gallerySurface() {
    const surface = document.querySelector('.delivery-sections');
    if (!(surface instanceof HTMLElement)) throw new Error('Gallery surface is missing');
    return surface;
}

beforeEach(async () => {
    await page.viewport(1200, 800);
    await cdp().send('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    });
});

afterEach(async () => {
    document.documentElement.style.scrollBehavior = '';
    await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe('delivery section navigation', () => {
    it.each([320, 390])('keeps long chapter labels and the download control inside a %ipx phone', async (width) => {
        await page.viewport(width, 740);
        await LongLabels.run();
        const toggle = page.getByRole('button', { name: 'Frederiksberg Have', exact: true });
        const label = toggle.element().querySelector('span');
        if (!label) throw new Error('Chapter label is missing');
        const styles = getComputedStyle(label);
        expect(Number.parseFloat(styles.fontSize)).toBeGreaterThanOrEqual(16);
        expect(styles.fontFamily).toMatch(/Archivo/);
        expect(styles.fontWeight).toBe('500');
        expect(toggle.element().getBoundingClientRect().height).toBeGreaterThanOrEqual(48);
        expect(label.getBoundingClientRect().right).toBeLessThanOrEqual(toggle.element().getBoundingClientRect().right);
        expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(width);
        await toggle.click();
        await expect.element(page.getByRole('link', { name: 'Familie og venner', exact: true })).toBeVisible();
        const sectionLink = page.getByRole('link', { name: 'Familie og venner', exact: true }).element();
        expect(Number.parseFloat(getComputedStyle(sectionLink).fontSize)).toBeGreaterThanOrEqual(16);
        expect(sectionLink.getBoundingClientRect().height).toBeGreaterThanOrEqual(48);
        expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(width);
        if (sectionLink instanceof HTMLElement) sectionLink.focus();
        await userEvent.keyboard('{Escape}');
        await expect.element(toggle).toHaveAttribute('aria-expanded', 'false');
        await expect.element(toggle).toHaveFocus();
    });

    it('jumps to the selected mobile chapter with motion enabled and keeps focus there', async () => {
        await page.viewport(320, 740);
        await cdp().send('Emulation.setEmulatedMedia', {
            features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
        });
        await WithDownload.run();
        await page.getByRole('button', { name: 'Vielsen', exact: true }).click();
        await page.getByRole('link', { name: 'Efter vielsen', exact: true }).click();
        await expect
            .poll(() => document.getElementById('after-ceremony')?.getBoundingClientRect().top)
            .toBeLessThan(150);
        await expect
            .element(page.getByRole('button', { name: 'Efter vielsen', exact: true }))
            .toHaveAttribute('aria-expanded', 'false');
        expect(document.activeElement).toBe(document.getElementById('after-ceremony'));
        expect(window.location.hash).toBe('#after-ceremony');
        expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(innerWidth);
        await page.getByRole('button', { name: 'Efter vielsen', exact: true }).click();
        await page.getByRole('link', { name: 'Vielsen', exact: true }).click();
        await expect.poll(() => document.getElementById('ceremony')?.getBoundingClientRect().top).toBeLessThan(150);
        await expect
            .element(page.getByRole('button', { name: 'Vielsen', exact: true }))
            .toHaveAttribute('aria-expanded', 'false');
    });

    it('animates a uniform gallery background with the menu, without gradients or divider borders', async () => {
        await cdp().send('Emulation.setEmulatedMedia', {
            features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
        });
        document.documentElement.style.scrollBehavior = 'auto';
        await GallerySections.run();
        const surface = gallerySurface();
        const nav = page.getByRole('navigation').element();
        const first = document.getElementById('ceremony');
        const footer = document.querySelector('footer');
        if (!first || !footer) throw new Error('Gallery section or footer is missing');
        expect(getComputedStyle(surface).backgroundColor).toBe('rgb(21, 22, 17)');
        expect(getComputedStyle(surface).transitionDuration).toBe('0.6s, 0.6s');
        expect(getComputedStyle(first).backgroundImage).toBe('none');
        expect(getComputedStyle(first).backgroundColor).toBe('rgba(0, 0, 0, 0)');
        expect(getComputedStyle(nav).borderBottomWidth).toBe('0px');
        expect(getComputedStyle(footer).borderTopWidth).toBe('0px');
        await page.getByRole('link', { name: 'Efter vielsen', exact: true }).click();
        await expect
            .poll(() => surface.getAnimations().some((animation) => animation instanceof CSSTransition))
            .toBe(true);
        expect(getComputedStyle(surface).backgroundColor).not.toBe('rgb(250, 255, 239)');
        await expect.poll(() => getComputedStyle(surface).backgroundColor).toBe('rgb(250, 255, 239)');
        expect(getComputedStyle(nav).backgroundColor).toBe(getComputedStyle(surface).backgroundColor);
        expect(getComputedStyle(first.querySelector('h2') ?? first).color).toBe('rgb(21, 22, 17)');
        await page.getByRole('link', { name: 'Vielsen', exact: true }).click();
        await expect.poll(() => getComputedStyle(surface).backgroundColor).toBe('rgb(21, 22, 17)');
    });

    it('updates the shared theme for text sections while keeping photo navigation active', async () => {
        await WithTextSection.run();
        const note = document.getElementById('gallery-note');
        if (!note) throw new Error('Text section is missing');
        note.scrollIntoView({ behavior: 'instant' });
        await expect.poll(() => getComputedStyle(gallerySurface()).backgroundColor).toBe('rgb(240, 243, 230)');
        await expect
            .element(page.getByRole('link', { name: 'Vielsen', exact: true }))
            .toHaveAttribute('aria-current', 'location');
        expect(gallerySurface().getAnimations()).toHaveLength(0);
        expect(getComputedStyle(gallerySurface()).transitionProperty).toBe('none');
    });

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
