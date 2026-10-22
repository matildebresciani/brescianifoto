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

        window.scrollTo({ top: cover.getBoundingClientRect().bottom + scrollY + 1, behavior: 'instant' });
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
