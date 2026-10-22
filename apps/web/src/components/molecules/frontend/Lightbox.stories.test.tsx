import { composeStories } from '@storybook/react';
import type { ComponentProps } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cdp, page, userEvent } from 'vitest/browser';
import * as stories from './Lightbox.stories';
import '@/app/(frontend)/globals.css';

// Image optimization is a server concern; keep real browser image sizing and pointer behavior here.
vi.mock('next/image', () => ({
    __esModule: true,
    default: ({ fill, priority, alt, ...props }: ComponentProps<'img'> & { fill?: boolean; priority?: boolean }) => (
        // biome-ignore lint/performance/noImgElement: Test the native layout without a Next.js image server.
        <img
            {...props}
            alt={alt}
            style={fill ? { position: 'absolute', inset: 0, width: '100%', height: '100%' } : undefined}
        />
    ),
}));

const { Default, SinglePhoto, ManyPhotos, WithOpener } = composeStories(stories);

function getViewport() {
    const viewport = document.querySelector('[data-lightbox-slide]:not([inert]) button');
    if (!(viewport instanceof HTMLButtonElement)) throw new Error('Photo viewport is missing');
    return viewport;
}

function getPhoto() {
    const photo = getViewport().querySelector('img');
    if (!photo) throw new Error('Photo is missing');
    return photo;
}

function getTransform() {
    const wrapper = getPhoto().parentElement;
    if (!wrapper) throw new Error('Photo wrapper is missing');
    return new DOMMatrix(getComputedStyle(wrapper).transform);
}

async function expectZoom(isZoomed: boolean) {
    await expect.poll(() => getViewport().getAttribute('aria-pressed')).toBe(String(isZoomed));
    await expect.poll(() => getTransform().a).toBe(isZoomed ? 2 : 1);
}

async function expectPhoto(alt: string) {
    await expect.poll(() => getPhoto().alt).toBe(alt);
}

async function expectActiveThumbnailVisible() {
    await expect
        .poll(() => {
            const active = document.querySelector('fieldset[aria-label="Photo thumbnails"] [aria-current="true"]');
            const strip = active?.parentElement;
            if (!active || !strip) return false;
            const photoRect = active.getBoundingClientRect();
            const stripRect = strip.getBoundingClientRect();
            return photoRect.left >= stripRect.left && photoRect.right <= stripRect.right;
        })
        .toBe(true);
}

async function drag(x: number, y: number) {
    const viewport = getViewport();
    const rect = viewport.getBoundingClientRect();
    const sourcePosition = { x: rect.width / 2, y: rect.height / 2 };
    await userEvent.dragAndDrop(viewport, viewport, {
        sourcePosition,
        targetPosition: { x: sourcePosition.x + x, y: sourcePosition.y + y },
    });
}

async function touchGesture(points: { x: number; y: number }[], shouldCancel = false, hasSecondPointer = false) {
    const viewport = getViewport();
    const rect = viewport.getBoundingClientRect();
    const start = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    const dispatch = (type: string, point: { x: number; y: number }, pointerId = 11) =>
        viewport.dispatchEvent(
            new PointerEvent(type, {
                bubbles: true,
                pointerType: 'touch',
                pointerId,
                isPrimary: pointerId === 11,
                clientX: start.x + point.x,
                clientY: start.y + point.y,
            }),
        );

    // Synthetic touch events have no active native pointer to capture.
    const capture = vi.spyOn(viewport, 'setPointerCapture').mockImplementation(() => {});
    dispatch('pointerdown', { x: 0, y: 0 });
    if (hasSecondPointer) dispatch('pointerdown', { x: 10, y: 0 }, 12);
    for (const point of points) dispatch('pointermove', point);
    dispatch(shouldCancel ? 'pointercancel' : 'pointerup', points.at(-1) ?? { x: 0, y: 0 });
    if (hasSecondPointer) dispatch('pointerup', { x: 10, y: 0 }, 12);
    capture.mockRestore();
}

async function nativeSwipe(x: number, target: Element = getViewport()) {
    const rect = target.getBoundingClientRect();
    const frameRect = window.frameElement?.getBoundingClientRect();
    const start = {
        x: rect.left + rect.width / 2 + (frameRect?.left ?? 0),
        y: rect.top + rect.height / 2 + (frameRect?.top ?? 0),
    };
    await cdp().send('Emulation.setTouchEmulationEnabled', { enabled: true });
    await cdp().send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
    for (let step = 1; step <= 5; step++) {
        await cdp().send('Input.dispatchTouchEvent', {
            type: 'touchMove',
            touchPoints: [{ x: start.x + (x * step) / 5, y: start.y }],
        });
    }
    await cdp().send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

beforeEach(async () => {
    await page.viewport(1200, 800);
});

afterEach(async () => {
    vi.restoreAllMocks();
    await cdp().send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe('desktop lightbox', () => {
    it('follows arrows and keyboard navigation, including wraparound, without scrolling the page', async () => {
        await ManyPhotos.run();
        const strip = page.getByRole('group', { name: 'Photo thumbnails' }).element();
        const pageTop = window.scrollY;
        const photoTop = getViewport().getBoundingClientRect().top;
        await page.getByRole('button', { name: 'Previous image', exact: true }).click();
        await expect
            .element(page.getByRole('button', { name: 'Go to photo 24', exact: true }))
            .toHaveAttribute('aria-current', 'true');
        await expectActiveThumbnailVisible();
        expect(strip.scrollLeft).toBeGreaterThan(0);
        await userEvent.keyboard('{ArrowLeft}');
        await expect
            .element(page.getByRole('button', { name: 'Go to photo 23', exact: true }))
            .toHaveAttribute('aria-current', 'true');
        await expectActiveThumbnailVisible();
        await page.viewport(800, 800);
        await expectActiveThumbnailVisible();
        await userEvent.keyboard('{ArrowRight}{ArrowRight}');
        await expect
            .element(page.getByRole('button', { name: 'Go to photo 1', exact: true }))
            .toHaveAttribute('aria-current', 'true');
        await expectActiveThumbnailVisible();
        await expect.poll(() => strip.scrollLeft).toBe(0);
        expect(window.scrollY).toBe(pageTop);
        expect(getViewport().getBoundingClientRect().top).toBe(photoTop);
    });

    it('drags the thumbnail strip both ways without selecting a photo, then allows clicks and keyboard selection', async () => {
        await ManyPhotos.run();
        await expectPhoto('Concert stage');
        const firstThumbnail = page.getByRole('button', { name: 'Go to photo 1', exact: true });
        const strip = firstThumbnail.element().parentElement;
        if (!strip) throw new Error('Thumbnail strip is missing');
        expect(strip.scrollWidth).toBeGreaterThan(strip.clientWidth);
        expect(getComputedStyle(strip).scrollBehavior).toBe('auto');

        await userEvent.dragAndDrop(strip, strip, {
            sourcePosition: { x: 340, y: 28 },
            targetPosition: { x: 140, y: 28 },
        });
        await expect.poll(() => strip.scrollLeft).toBeGreaterThan(150);
        await expect.element(firstThumbnail).toHaveAttribute('aria-current', 'true');
        expect(getComputedStyle(strip).cursor).toBe('grab');

        await userEvent.dragAndDrop(strip, strip, {
            sourcePosition: { x: 140, y: 28 },
            targetPosition: { x: 340, y: 28 },
        });
        await expect.poll(() => strip.scrollLeft).toBe(0);
        await expect.element(firstThumbnail).toHaveAttribute('aria-current', 'true');

        const secondThumbnail = page.getByRole('button', { name: 'Go to photo 2', exact: true });
        await secondThumbnail.click();
        await expect.element(secondThumbnail).toHaveAttribute('aria-current', 'true');
        firstThumbnail.element().focus();
        await userEvent.keyboard('{Enter}');
        await expect.element(firstThumbnail).toHaveAttribute('aria-current', 'true');
    });

    it('traps focus, locks the background, and restores the opener on Escape', async () => {
        await WithOpener.run();
        const opener = page.getByRole('button', { name: 'Open viewer' }).element();
        await userEvent.click(opener);
        await expect.element(page.getByRole('dialog')).toBeVisible();
        await expect.poll(() => document.body.style.overflow).toBe('hidden');
        await expect.poll(() => opener.closest('[inert]')).not.toBeNull();
        await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
        expect(document.activeElement?.getAttribute('aria-label')).toBe('Go to photo 2');
        await userEvent.keyboard('{Tab}');
        expect(document.activeElement?.getAttribute('aria-label')).toBe('Close');
        await userEvent.keyboard('{Escape}');
        await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
        expect(opener.closest('[inert]')).toBeNull();
        expect(document.activeElement).toBe(opener);
        expect(document.body.style.overflow).not.toBe('hidden');
    });

    it('toggles zoom, pans within bounds without navigating, and suppresses the drag click', async () => {
        await Default.run();
        await expectPhoto('Concert stage');
        await userEvent.click(getViewport());
        await expectZoom(true);
        await drag(200, 100);
        await expectPhoto('Concert stage');
        await expectZoom(true);
        await expect.poll(() => getTransform().e).toBeGreaterThan(0);
        await drag(400, 150);
        await expectZoom(true);
        const rect = getViewport().getBoundingClientRect();
        const photoRect = getPhoto().getBoundingClientRect();
        expect(Math.abs(getTransform().e)).toBeLessThanOrEqual(Math.max(0, (photoRect.width - rect.width) / 2));
        expect(Math.abs(getTransform().f)).toBeLessThanOrEqual(Math.max(0, (photoRect.height - rect.height) / 2));
        await userEvent.click(getViewport());
        await expectZoom(false);
    });

    it('navigates by mouse drag with wraparound and ignores short or vertical drags', async () => {
        await Default.run();
        await drag(-150, 0);
        await expectPhoto('Artist portrait');
        await expectZoom(false);
        await drag(-150, 0);
        await expectPhoto('Concert stage');
        await drag(150, 0);
        await expectPhoto('Artist portrait');
        await drag(20, 0);
        await drag(60, 100);
        await expectPhoto('Artist portrait');
        await expectZoom(false);
    });

    it('resets zoom through arrows, thumbnails, keyboard navigation, and resizing', async () => {
        await Default.run();
        await userEvent.click(getViewport());
        await expectZoom(true);
        await page.getByRole('button', { name: 'Next image', exact: true }).click();
        await expectPhoto('Artist portrait');
        await expectZoom(false);
        await userEvent.click(getViewport());
        await page.getByRole('button', { name: 'Go to photo 1' }).click();
        await expectPhoto('Concert stage');
        await expectZoom(false);
        getViewport().focus();
        await userEvent.keyboard('{Enter}');
        await expectZoom(true);
        await userEvent.keyboard(' ');
        await expectZoom(false);
        await userEvent.keyboard('{Enter}{ArrowLeft}');
        await expectPhoto('Artist portrait');
        await expectZoom(false);
        getViewport().focus();
        await userEvent.keyboard('{ArrowRight}');
        await expectPhoto('Concert stage');
        await userEvent.click(getViewport());
        await expectZoom(true);
        await page.viewport(1000, 700);
        await expectZoom(false);
        await userEvent.keyboard('{Escape}');
        await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
    });

    it('zooms a single photo without showing arrows or navigating on drag', async () => {
        await SinglePhoto.run();
        await expectPhoto('Artist portrait');
        await expect.element(page.getByRole('button', { name: 'Next image' })).not.toBeInTheDocument();
        await drag(-150, 0);
        await expectPhoto('Artist portrait');
        await userEvent.click(getViewport());
        await expectZoom(true);
    });

    it('zooms toward the clicked point and removes transitions for reduced motion', async () => {
        await cdp().send('Emulation.setEmulatedMedia', {
            features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
        });
        await Default.run();
        await expectPhoto('Concert stage');
        const viewport = getViewport();
        const rect = viewport.getBoundingClientRect();
        await userEvent.click(viewport, { position: { x: rect.width / 2 - 100, y: rect.height / 2 } });
        await expectZoom(true);
        expect(Math.abs(getTransform().e - 100)).toBeLessThan(2);
        expect(getComputedStyle(getPhoto().parentElement ?? viewport).transitionProperty).toBe('none');
    });
});

describe('mobile lightbox', () => {
    beforeEach(async () => {
        await page.viewport(390, 844);
    });

    it('keeps the selected thumbnail visible when swiping across the ends of the gallery', async () => {
        await ManyPhotos.run();
        await nativeSwipe(100);
        await expect
            .element(page.getByRole('button', { name: 'Go to photo 24', exact: true }))
            .toHaveAttribute('aria-current', 'true');
        await expectActiveThumbnailVisible();
        await nativeSwipe(-100);
        await expect
            .element(page.getByRole('button', { name: 'Go to photo 1', exact: true }))
            .toHaveAttribute('aria-current', 'true');
        await expectActiveThumbnailVisible();
    });

    it('removes arrow space and fits landscape and portrait photos without cropping', async () => {
        await Default.run();
        await expectPhoto('Concert stage');
        await expect.element(page.getByRole('button', { name: 'Next image', includeHidden: true })).not.toBeVisible();
        await expect
            .element(page.getByRole('button', { name: 'Previous image', includeHidden: true }))
            .not.toBeVisible();
        const viewportRect = getViewport().getBoundingClientRect();
        expect(viewportRect.width).toBe(390 - 16);
        await expect.poll(() => getPhoto().getBoundingClientRect().width).toBeCloseTo(viewportRect.width);
        await page.getByRole('button', { name: 'Go to photo 2' }).click();
        await expectPhoto('Artist portrait');
        await expect
            .poll(() => {
                const rect = getPhoto().getBoundingClientRect();
                return rect.width / rect.height;
            })
            .toBeCloseTo(900 / 1200);
        const photoRect = getPhoto().getBoundingClientRect();
        expect(photoRect.width).toBeLessThanOrEqual(viewportRect.width);
        expect(photoRect.height).toBeLessThanOrEqual(viewportRect.height);
        expect(photoRect.width / photoRect.height).toBeCloseTo(900 / 1200);
        await userEvent.click(getViewport());
        expect(getViewport().hasAttribute('aria-pressed')).toBe(false);
        expect(getTransform().a).toBe(1);
    });

    it('swipes both ways and ignores short, vertical, cancelled, and multipointer gestures', async () => {
        await Default.run();
        await expectPhoto('Concert stage');
        await touchGesture([{ x: -100, y: 0 }]);
        await expectPhoto('Artist portrait');
        await touchGesture([{ x: 100, y: 0 }]);
        await expectPhoto('Concert stage');
        await touchGesture([{ x: -20, y: 0 }]);
        await touchGesture([{ x: -60, y: 100 }]);
        await touchGesture([{ x: -100, y: 0 }], true);
        await touchGesture([{ x: -100, y: 0 }], false, true);
        await expectPhoto('Concert stage');
        await touchGesture([{ x: 100, y: 0 }]);
        await expectPhoto('Artist portrait');
    });

    it('supports native touch swipes while keeping browser pinch zoom available', async () => {
        await Default.run();
        await expectPhoto('Concert stage');
        expect(getComputedStyle(getViewport()).touchAction).toBe('pan-y pinch-zoom');
        await nativeSwipe(-100);
        await expectPhoto('Artist portrait');
        await nativeSwipe(100);
        await expectPhoto('Concert stage');
    });

    it('lets the thumbnail strip scroll without changing the selected photo', async () => {
        await ManyPhotos.run();
        await expectPhoto('Concert stage');
        const thumbnail = page.getByRole('button', { name: 'Go to photo 1', exact: true }).element();
        const strip = thumbnail.parentElement;
        if (!strip) throw new Error('Thumbnail strip is missing');
        expect(strip.scrollWidth).toBeGreaterThan(strip.clientWidth);
        await nativeSwipe(-150, strip);
        await expect.poll(() => strip.scrollLeft).toBeGreaterThan(0);
        await expect
            .element(page.getByRole('button', { name: 'Go to photo 1', exact: true }))
            .toHaveAttribute('aria-current', 'true');
        await expectPhoto('Concert stage');
    });
});
