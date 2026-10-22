import { composeStories } from '@storybook/react';
import type { ComponentProps } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cdp, page, userEvent } from 'vitest/browser';
import * as stories from './GalleryLightbox.stories';
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

const { MultipleSections, SinglePhoto } = composeStories(stories);

async function expectPhoto(name: string, count: string) {
    await expect.poll(() => document.querySelector('[role="dialog"] .metadata')?.textContent).toBe(count);
    await expect
        .poll(() =>
            document
                .querySelector(
                    '[role="dialog"] button[aria-pressed] img, [role="dialog"] button[aria-label="Photo viewer"] img',
                )
                ?.getAttribute('alt'),
        )
        .toBe(name);
}

beforeEach(async () => {
    await page.viewport(1200, 800);
    await cdp().send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
});

afterEach(async () => {
    await cdp().send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe('one lightbox for the complete client gallery', () => {
    it('crosses section boundaries, skips text and empty sections, and wraps across the whole gallery', async () => {
        await MultipleSections.run();
        await page.getByRole('button', { name: 'Open photo 2: Artist portrait', exact: true }).click();
        await expectPhoto('Artist portrait', '2 / 3');
        expect(document.querySelectorAll('[role="dialog"] [aria-label^="Go to photo "]')).toHaveLength(3);
        await expect
            .element(page.getByRole('link', { name: 'Download original' }))
            .toHaveAttribute('href', '/downloads/artist');
        await page.getByRole('button', { name: 'Next photo', exact: true }).click();
        await expectPhoto('Crowd', '3 / 3');
        await expect.element(page.getByRole('link', { name: 'Download original' })).not.toBeInTheDocument();
        await userEvent.keyboard('{ArrowRight}');
        await expectPhoto('Concert stage', '1 / 3');
        await userEvent.keyboard('{ArrowLeft}');
        await expectPhoto('Crowd', '3 / 3');
        await page.getByRole('button', { name: 'Go to photo 1', exact: true }).click();
        await expectPhoto('Concert stage', '1 / 3');
    });

    it('opens later-section photos at their global index and maps repeated photos to one slide', async () => {
        await MultipleSections.run();
        const opener = page.getByRole('button', { name: 'Open photo 1: Crowd', exact: true });
        await opener.click();
        await expectPhoto('Crowd', '3 / 3');
        const dialog = page.getByRole('dialog').element();
        expect(getComputedStyle(dialog).backgroundColor).toBe('rgb(37, 38, 31)');
        await page.getByRole('button', { name: 'Go to photo 2', exact: true }).click();
        await expectPhoto('Artist portrait', '2 / 3');
        expect(getComputedStyle(dialog).backgroundColor).toBe('rgb(37, 38, 31)');
        await userEvent.keyboard('{Escape}');
        expect(document.activeElement).toBe(opener.element());
        await page.getByRole('button', { name: 'Open photo 2: Concert stage', exact: true }).click();
        await expectPhoto('Concert stage', '1 / 3');
        expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(1);
    });

    it('swipes from one section to the next on mobile', async () => {
        await page.viewport(390, 844);
        await MultipleSections.run();
        await page.getByRole('button', { name: 'Open photo 2: Artist portrait', exact: true }).click();
        await expectPhoto('Artist portrait', '2 / 3');
        await expect
            .element(page.getByRole('button', { name: 'Next photo', exact: true, includeHidden: true }))
            .not.toBeVisible();
        const photo = document.querySelector('[role="dialog"] button[aria-label="Photo viewer"]');
        if (!photo) throw new Error('Photo viewport is missing');
        const rect = photo.getBoundingClientRect();
        const frame = window.frameElement?.getBoundingClientRect();
        const x = rect.left + rect.width * 0.75 + (frame?.left ?? 0);
        const y = rect.top + rect.height / 2 + (frame?.top ?? 0);
        await cdp().send('Emulation.setTouchEmulationEnabled', { enabled: true });
        await cdp().send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
        for (let step = 1; step <= 5; step++) {
            await cdp().send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - step * 30, y }] });
        }
        await cdp().send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await expectPhoto('Crowd', '3 / 3');
    });

    it('omits arrows and thumbnails when the complete gallery has one photo', async () => {
        await SinglePhoto.run();
        await page.getByRole('button', { name: 'Open photo 1: Artist portrait', exact: true }).click();
        await expectPhoto('Artist portrait', '1 / 1');
        await expect.element(page.getByRole('button', { name: 'Next photo', exact: true })).not.toBeInTheDocument();
        expect(document.querySelectorAll('[role="dialog"] [aria-label^="Go to photo "]')).toHaveLength(0);
    });
});
