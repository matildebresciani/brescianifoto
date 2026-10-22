import { composeStories } from '@storybook/react';
import type { ComponentProps } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cdp, page, userEvent } from 'vitest/browser';
import * as stories from './PhotoSection.stories';

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

const { MixedPhotos, SinglePhoto, ManyPhotos } = composeStories(stories);

function getGrid() {
    const grid = document.querySelector('.delivery-photo-grid');
    if (!(grid instanceof HTMLDivElement)) throw new Error('Photo grid is missing');
    return grid;
}

function getTiles() {
    return Array.from(getGrid().querySelectorAll<HTMLElement>('.delivery-photo'));
}

async function expectMeasured() {
    await expect
        .poll(() => {
            const firstTile = getTiles()[0];
            const columns = Number.parseInt(
                getComputedStyle(getGrid()).getPropertyValue('--delivery-photo-columns'),
                10,
            );
            return Math.abs(
                (Number.parseFloat(firstTile?.style.width ?? '') || 0) -
                    (getGrid().getBoundingClientRect().width - 2 * (columns - 1)) / columns,
            );
        })
        .toBeLessThan(1);
}

function expectAlignedMasonry() {
    const grid = getGrid();
    expect(getComputedStyle(grid).gap).toBe('2px');
    expect(grid.scrollWidth).toBeLessThanOrEqual(grid.clientWidth);
    const tiles = getTiles();
    const columns = new Map<number, HTMLElement[]>();
    for (const tile of tiles) {
        const left = Number.parseFloat(tile.style.left);
        const column = columns.get(left) ?? [];
        column.push(tile);
        columns.set(left, column);
    }
    const firstWidth = tiles[0]?.getBoundingClientRect().width ?? 0;
    for (const [columnIndex, column] of [...columns.values()].entries()) {
        for (const [index, tile] of column.entries()) {
            const bounds = tile.getBoundingClientRect();
            const image = tile.querySelector('img');
            if (!image) throw new Error('Photo missing');
            expect(bounds.width).toBeCloseTo(firstWidth, 1);
            expect(getComputedStyle(image).objectFit).toBe('cover');
            expect(image.getBoundingClientRect().height).toBeCloseTo(bounds.height, 1);
            expect(bounds.left - grid.getBoundingClientRect().left).toBeCloseTo(columnIndex * (firstWidth + 2), 1);
            const previous = column[index - 1];
            if (previous) expect(bounds.top - previous.getBoundingClientRect().bottom).toBeCloseTo(2, 1);
            else expect(bounds.top).toBeCloseTo(grid.getBoundingClientRect().top, 1);
            if (index === column.length - 1) expect(bounds.bottom).toBeCloseTo(grid.getBoundingClientRect().bottom, 1);
            else {
                const ratio =
                    Number(image.getAttribute('width')) < Number(image.getAttribute('height')) ? 3 / 4 : 4 / 3;
                expect(bounds.width / bounds.height).toBeCloseTo(ratio, 2);
            }
        }
    }
}

beforeEach(async () => {
    await page.viewport(1440, 900);
    await cdp().send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
});

afterEach(async () => {
    await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe('client gallery masonry', () => {
    it('uses equal-width columns, normal tile ratios, 2px gaps and a straight bottom at every breakpoint', async () => {
        await MixedPhotos.run();
        for (const width of [320, 375, 768, 1024, 1280, 1440]) {
            await page.viewport(width, 900);
            await expectMeasured();
            expectAlignedMasonry();
            expect(
                Array.from(getGrid().querySelectorAll('button'), (button) => button.getAttribute('aria-label')),
            ).toEqual(Array.from({ length: 17 }, (_, index) => `Open photo ${index + 1}: Photo ${index + 1}`));
        }
    });

    it('reflows on container resize and on a breakpoint change with a fixed container width', async () => {
        await MixedPhotos.run();
        await expectMeasured();
        const grid = getGrid();
        grid.style.width = '500px';
        await expectMeasured();
        expectAlignedMasonry();
        const desktopWidth = getTiles()[0]?.getBoundingClientRect().width;
        await page.viewport(767, 900);
        await expect.poll(() => getTiles()[0]?.getBoundingClientRect().width).not.toBe(desktopWidth);
        expectAlignedMasonry();
        grid.style.width = '100%';
        await expectMeasured();
        expectAlignedMasonry();
    });

    it('keeps a single photo at the normal column width and portrait ratio', async () => {
        await SinglePhoto.run();
        await expectMeasured();
        const bounds = getTiles()[0]?.getBoundingClientRect();
        expect((bounds?.width ?? 0) / (bounds?.height ?? 1)).toBeCloseTo(3 / 4);
        expectAlignedMasonry();
    });

    it('preserves keyboard order, saved lightbox indices, downloads and focus return', async () => {
        await MixedPhotos.run();
        await expectMeasured();
        const buttons = getGrid().querySelectorAll('button');
        buttons[0]?.focus();
        await userEvent.keyboard('{Tab}');
        expect(document.activeElement).toBe(buttons[1]);
        await page.getByRole('button', { name: 'Open photo 8: Photo 8', exact: true }).click();
        await expect.element(page.getByRole('dialog', { name: 'Gallery photo viewer' })).toBeVisible();
        await expect
            .element(page.getByRole('link', { name: 'Download original' }))
            .toHaveAttribute('href', '/test-original/photo-7.jpg');
        await userEvent.keyboard('{ArrowRight}');
        await expect
            .element(page.getByRole('link', { name: 'Download original' }))
            .toHaveAttribute('href', '/test-original/photo-8.jpg');
        await userEvent.keyboard('{ArrowLeft}{Escape}');
        await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
        expect(document.activeElement).toBe(buttons[7]);
    });

    it('keeps 500 photos ordered, lazy-loaded and static with reduced motion', async () => {
        await ManyPhotos.run();
        await expectMeasured();
        expectAlignedMasonry();
        const figures = getGrid().querySelectorAll('figure');
        expect(figures).toHaveLength(500);
        figures.forEach((figure, index) => {
            expect(figure.querySelector('button')?.getAttribute('aria-label')).toBe(
                `Open photo ${index + 1}: Photo ${index + 1}`,
            );
            expect(figure.querySelector('img')?.getAttribute('loading')).toBe('lazy');
            expect(getComputedStyle(figure).opacity).toBe('1');
            expect(getComputedStyle(figure).transform).toBe('none');
        });
    });
});
