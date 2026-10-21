import { composeStories } from '@storybook/react';
import type { ComponentProps } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cdp, page, userEvent } from 'vitest/browser';
import * as stories from './Gallery.stories';
import '@/app/(frontend)/globals.css';

vi.mock('next/image', () => ({
    __esModule: true,
    default: ({ fill, priority, alt, ...props }: ComponentProps<'img'> & { fill?: boolean; priority?: boolean }) => (
        // biome-ignore lint/performance/noImgElement: Exercise native sizing without a Next.js image server.
        <img
            {...props}
            alt={alt}
            style={fill ? { position: 'absolute', inset: 0, width: '100%', height: '100%' } : undefined}
        />
    ),
}));

const { MixedOrientations } = composeStories(stories);

function getGallery() {
    const gallery = document.querySelector('figure')?.parentElement?.parentElement;
    if (!gallery) throw new Error('Gallery is missing');
    return gallery;
}

function getPlacements() {
    return Array.from(getGallery().children, (column) =>
        Array.from(column.querySelectorAll('button'), (button) =>
            Number(button.getAttribute('aria-label')?.match(/^Open photo (\d+)/)?.[1]),
        ),
    );
}

beforeEach(async () => {
    await page.viewport(1280, 900);
    await cdp().send('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    });
});

afterEach(async () => {
    await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe('balanced gallery', () => {
    it('fills the short middle column and preserves original photo proportions', async () => {
        await MixedOrientations.run();
        await expect.poll(getPlacements).toEqual([
            [1, 5, 7],
            [2, 4, 8, 9],
            [3, 6],
        ]);
        const gallery = getGallery();
        const columns = Array.from(gallery.children);
        const heights = columns.map((column) => column.getBoundingClientRect().height);
        const firstColumn = columns[0];
        if (!firstColumn) throw new Error('Gallery column is missing');
        const columnWidth = firstColumn.getBoundingClientRect().width;
        const oldSpread = ((3 * 1200) / 900 - (3 * 900) / 1600) * columnWidth;
        expect(Math.max(...heights) - Math.min(...heights)).toBeLessThan(oldSpread * 0.65);
        for (const button of gallery.querySelectorAll('button')) {
            const image = button.querySelector('img');
            if (!image) throw new Error('Photo is missing');
            const bounds = button.getBoundingClientRect();
            const ratio = Number(image.getAttribute('width')) / Number(image.getAttribute('height'));
            expect(bounds.width / bounds.height).toBeCloseTo(ratio, 2);
        }
    });

    it('rebalances across column and spacing breakpoints without losing photos', async () => {
        await MixedOrientations.run();
        for (const width of [1023, 767, 375, 768, 1024, 1440]) {
            await page.viewport(width, 900);
            await expect.poll(() => getGallery().children.length).toBe(width >= 1024 ? 3 : 2);
            await expect
                .poll(() =>
                    getPlacements()
                        .flat()
                        .sort((a, b) => a - b),
                )
                .toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
            const gallery = getGallery();
            expect(gallery.scrollWidth).toBeLessThanOrEqual(gallery.clientWidth);
        }
        await expect.poll(getPlacements).toEqual([
            [1, 5, 7],
            [2, 4, 8, 9],
            [3, 6],
        ]);
    });

    it('remeasures a container resize even when the viewport does not change', async () => {
        await MixedOrientations.run();
        const gallery = getGallery();
        gallery.style.width = '240px';
        await expect.poll(() => getPlacements()[2]).toContain(9);
        gallery.style.width = '100%';
        await expect.poll(() => getPlacements()[1]).toContain(9);
    });

    it('opens redistributed photos at their saved index and navigates in saved order', async () => {
        await MixedOrientations.run();
        await page.getByRole('button', { name: 'Open photo 8 of 9: Gallery photo 8', exact: true }).click();
        await expect.element(page.getByRole('dialog', { name: 'Gallery photo 8' })).toBeVisible();
        await userEvent.keyboard('{ArrowRight}');
        await expect.element(page.getByRole('dialog', { name: 'Gallery photo 9' })).toBeVisible();
        await userEvent.keyboard('{ArrowLeft}');
        await expect.element(page.getByRole('dialog', { name: 'Gallery photo 8' })).toBeVisible();
        await userEvent.keyboard('{Escape}');
        await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
    });

    it('keeps photos visible and untransformed with reduced motion', async () => {
        await MixedOrientations.run();
        for (const figure of getGallery().querySelectorAll('figure')) {
            expect(getComputedStyle(figure).opacity).toBe('1');
            expect(getComputedStyle(figure).transform).toBe('none');
        }
    });
});
