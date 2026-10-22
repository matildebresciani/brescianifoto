import { composeStories } from '@storybook/react';
import type { ComponentProps } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cdp, page, userEvent } from 'vitest/browser';
import * as stories from './DeliveryGallery.stories';
import '@/app/(frontend)/globals.css';
import '@/app/(delivery)/deliveries/delivery.css';

vi.mock('next/image', () => ({
    __esModule: true,
    default: ({
        fill,
        priority,
        alt,
        style,
        ...props
    }: ComponentProps<'img'> & { fill?: boolean; priority?: boolean }) => (
        // biome-ignore lint/performance/noImgElement: Exercise real browser layout without the Next.js optimizer.
        <img
            {...props}
            alt={alt}
            style={fill ? { ...style, position: 'absolute', inset: 0, width: '100%', height: '100%' } : style}
        />
    ),
}));

vi.mock('@/components/molecules/admin/LivePreviewListener', () => ({ LivePreviewListener: () => null }));

const { WholeGallery, EditorialGallery } = composeStories(stories);

beforeEach(async () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    await page.viewport(1200, 800);
    await cdp().send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
});

afterEach(async () => {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe('floating gallery return control', () => {
    it.each([
        { width: 390, story: WholeGallery, layout: 'overlay' },
        { width: 1200, story: WholeGallery, layout: 'overlay' },
        { width: 390, story: EditorialGallery, layout: 'editorial' },
        { width: 1200, story: EditorialGallery, layout: 'editorial' },
    ])('returns to the page start at $width px with the $layout cover', async ({ width, story }) => {
        await page.viewport(width, 844);
        await story.run();
        await cdp().send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 0, y: 0 });
        const control = document.querySelector('.delivery-back-to-top');
        const cover = document.querySelector('.delivery-hero');
        const surface = document.querySelector('.delivery-sections');
        const top = document.getElementById('top');
        if (!(control instanceof HTMLButtonElement) || !cover || !surface || !top) {
            throw new Error('Gallery controls are missing');
        }
        await expect.element(control).not.toBeVisible();
        expect(document.querySelectorAll('#top')).toHaveLength(1);
        expect(top.classList.contains('delivery-page')).toBe(true);
        expect(control.textContent).toBe('');

        window.scrollTo({ top: cover.getBoundingClientRect().bottom + scrollY + 80, behavior: 'instant' });
        if (width < 768) {
            await expect.element(control).not.toBeVisible();
            // Let the downward movement register before reversing direction.
            await expect.poll(() => cover.getBoundingClientRect().bottom).toBeLessThan(0);
            await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
            window.scrollBy({ top: -24, behavior: 'instant' });
        }
        await expect.element(control).toBeVisible();
        const rect = control.getBoundingClientRect();
        expect(rect.width).toBe(48);
        expect(rect.height).toBe(48);
        expect(rect.right).toBe(width - 24);
        expect(rect.bottom).toBe(innerHeight - 24);
        expect(getComputedStyle(control).borderRadius).toBe('2px');
        expect(getComputedStyle(control).backgroundColor).toBe('rgba(0, 0, 0, 0)');
        expect(getComputedStyle(control).color).toBe('rgb(250, 255, 239)');
        expect(getComputedStyle(control).borderColor).toBe('rgb(250, 255, 239)');

        const laterSection = document.getElementById('second');
        if (!laterSection) throw new Error('Later section is missing');
        laterSection.scrollIntoView({ behavior: 'instant' });
        await expect.poll(() => getComputedStyle(surface).backgroundColor).toBe('rgb(37, 38, 31)');
        if (width < 768) {
            await expect.element(control).not.toBeVisible();
            window.scrollBy({ top: -24, behavior: 'instant' });
            await expect.element(control).toBeVisible();
        }
        expect(getComputedStyle(control).backgroundColor).toBe('rgba(0, 0, 0, 0)');
        expect(getComputedStyle(control).color).toBe('rgb(250, 255, 239)');
        await page.getByRole('button', { name: 'Til toppen', exact: true }).hover();
        await expect.poll(() => getComputedStyle(control).backgroundColor).toBe('rgb(250, 255, 239)');
        expect(getComputedStyle(control).color).toBe('rgb(21, 22, 17)');
        const opener = page.getByRole('button', { name: 'Åbn billede 1: Crowd', exact: true });
        await opener.click();
        await expect.element(control).not.toBeVisible();
        await userEvent.keyboard('{Escape}');
        await expect.element(control).toBeVisible();
        await expect.element(opener).toHaveFocus();

        await page.getByRole('button', { name: 'Til toppen', exact: true }).click();
        expect(scrollY).toBe(0);
        expect(document.activeElement).toBe(top);
        await expect.element(control).not.toBeVisible();
        expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(width);
    });

    it.each([320, 390])('only reveals on a deliberate upward scroll at %ipx', async (width) => {
        await page.viewport(width, 844);
        await WholeGallery.run();
        const control = document.querySelector('.delivery-back-to-top');
        const cover = document.querySelector('.delivery-hero');
        if (!(control instanceof HTMLButtonElement) || !cover) throw new Error('Gallery controls are missing');
        window.scrollTo({ top: cover.getBoundingClientRect().bottom + scrollY + 240, behavior: 'instant' });
        await expect.poll(() => cover.getBoundingClientRect().bottom).toBeLessThan(-200);
        await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        expect(control.inert).toBe(true);
        expect(control.tabIndex).toBe(-1);
        await expect.element(control).not.toBeVisible();

        window.scrollBy({ top: -6, behavior: 'instant' });
        await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        expect(control.dataset.visible).toBe('false');
        window.scrollBy({ top: -18, behavior: 'instant' });
        await expect.element(control).toBeVisible();
        expect(control.inert).toBe(false);
        expect(control.tabIndex).toBe(0);
        expect(getComputedStyle(control).transitionProperty).toBe('none');

        window.scrollBy({ top: 24, behavior: 'instant' });
        await expect.element(control).not.toBeVisible();
        expect(control.inert).toBe(true);
        expect(control.getAttribute('aria-hidden')).toBe('true');

        await page.viewport(1200, 844);
        await expect.element(control).toBeVisible();
        await page.viewport(width, 844);
        await expect.element(control).not.toBeVisible();
    });

    it('fades and slides in and out while disabling hidden controls immediately', async () => {
        await page.viewport(390, 844);
        await cdp().send('Emulation.setEmulatedMedia', {
            features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
        });
        await WholeGallery.run();
        const control = document.querySelector('.delivery-back-to-top');
        const cover = document.querySelector('.delivery-hero');
        if (!(control instanceof HTMLButtonElement) || !cover) throw new Error('Gallery controls are missing');
        window.scrollTo({ top: cover.getBoundingClientRect().bottom + scrollY + 240, behavior: 'instant' });
        await expect.poll(() => cover.getBoundingClientRect().bottom).toBeLessThan(-200);
        await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        window.scrollBy({ top: -24, behavior: 'instant' });
        await expect.poll(() => control.dataset.visible).toBe('true');
        await expect.poll(() => getComputedStyle(control).opacity).toBe('1');
        await expect.poll(() => getComputedStyle(control).translate).toBe('0px');
        expect(getComputedStyle(control).transitionProperty).toContain('opacity');
        expect(getComputedStyle(control).transitionProperty).toContain('translate');

        window.scrollBy({ top: 24, behavior: 'instant' });
        await expect.poll(() => control.dataset.visible).toBe('false');
        expect(control.inert).toBe(true);
        expect(getComputedStyle(control).pointerEvents).toBe('none');
        await expect.element(control).not.toBeVisible();
        expect(getComputedStyle(control).opacity).toBe('0');
        await expect.poll(() => getComputedStyle(control).translate).toBe('0px 16px');
    });

    it('scrolls smoothly with motion enabled and keeps focus at the page start', async () => {
        await cdp().send('Emulation.setEmulatedMedia', {
            features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
        });
        await WholeGallery.run();
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
        const control = page.getByRole('button', { name: 'Til toppen', exact: true });
        await expect.element(control).toBeVisible();
        const element = control.element();
        await control.click();
        expect(document.activeElement).toBe(document.getElementById('top'));
        await expect.poll(() => scrollY).toBe(0);
        await expect.element(element).not.toBeVisible();
    });
});
