import { composeStories } from '@storybook/react';
import { type ComponentProps, useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import * as stories from './Lightbox.stories';
import '@/app/(frontend)/globals.css';

const { requests } = vi.hoisted(() => {
    const requests: { src: string; size: string; priority?: string }[] = [];
    return { requests };
});

vi.mock('next/image', () => ({
    __esModule: true,
    default: function LoadingImage({
        fill,
        priority,
        onLoad,
        onError,
        ...props
    }: ComponentProps<'img'> & { fill?: boolean; priority?: boolean }) {
        const { src = '', sizes = '', fetchPriority } = props;
        useEffect(() => {
            requests.push({ src, size: sizes, priority: fetchPriority });
        }, [src, sizes, fetchPriority]);
        return (
            // biome-ignore lint/performance/noImgElement: Control completion independently of the local asset cache.
            <img
                {...props}
                alt={props.alt}
                style={fill ? { position: 'absolute', inset: 0, width: '100%', height: '100%' } : props.style}
                onLoad={(event) => {
                    if (!event.isTrusted) onLoad?.(event);
                }}
                onError={(event) => {
                    if (!event.isTrusted) onError?.(event);
                }}
            />
        );
    },
}));

const { LoadingSequence } = composeStories(stories);
const backgroundRequests = () => requests.filter(({ priority }) => priority === 'low');
const settleNavigation = () => new Promise((resolve) => setTimeout(resolve, 280));

function mainImage() {
    const image = document.querySelector('img[fetchpriority="high"]');
    if (!(image instanceof HTMLImageElement)) throw new Error('Main image is missing');
    return image;
}

function completeMain() {
    mainImage().dispatchEvent(new Event('load'));
}

function completeBackground(type = 'load') {
    const image = document.querySelector('img[fetchpriority="low"]');
    if (!image) throw new Error('Background request is missing');
    image.dispatchEvent(new Event(type));
}

beforeEach(async () => {
    requests.length = 0;
    await page.viewport(1200, 800);
});

afterEach(() => {
    Reflect.deleteProperty(navigator, 'connection');
});

describe('lightbox loading budget', () => {
    it('requests the fitted main image eagerly and shows a thumbnail preview until it loads', async () => {
        await LoadingSequence.run();
        const image = mainImage();
        const viewport = image.closest('button')?.getBoundingClientRect();
        if (!viewport) throw new Error('Photo viewport is missing');
        expect(image.loading).toBe('eager');
        expect(image.sizes).toBe(`${Math.ceil((viewport.height * 900) / 1200)}px`);
        expect(Number.parseFloat(image.sizes)).toBeLessThan(1200);
        expect(image.parentElement?.querySelector('img[sizes="56px"]')?.getAttribute('alt')).toBe('');
        await settleNavigation();
        expect(backgroundRequests()).toHaveLength(0);
        completeMain();
        await expect.poll(() => image.parentElement?.querySelector('img[sizes="56px"]')).toBeNull();
        await expect.poll(() => backgroundRequests().length).toBe(1);
        expect(backgroundRequests()[0]?.src).toContain('photo=2');
    });

    it('keeps one speculative request in flight and replaces stale neighbors after navigation', async () => {
        await LoadingSequence.run();
        completeMain();
        await expect.poll(() => backgroundRequests().length).toBe(1);
        await page.getByRole('button', { name: 'Go to photo 4', exact: true }).click();
        completeMain();
        await settleNavigation();
        expect(backgroundRequests()).toHaveLength(1);
        completeBackground();
        await expect.poll(() => backgroundRequests().length).toBe(2);
        expect(backgroundRequests()[1]?.src).toContain('photo=5');
        completeBackground();
        await expect.poll(() => backgroundRequests().length).toBe(3);
        expect(backgroundRequests()[2]?.src).toContain('photo=3');
        completeBackground();
        await settleNavigation();
        expect(backgroundRequests()).toHaveLength(3);
        expect(backgroundRequests().some(({ src }) => src.includes('photo=6'))).toBe(false);
    });

    it('cancels queued preloads during rapid navigation and requests matching sizes on selection', async () => {
        await LoadingSequence.run();
        completeMain();
        await page.getByRole('button', { name: 'Go to photo 2', exact: true }).click();
        completeMain();
        await page.getByRole('button', { name: 'Go to photo 3', exact: true }).click();
        completeMain();
        await expect.poll(() => backgroundRequests().length).toBe(1);
        const warmed = backgroundRequests()[0];
        expect(warmed?.src).toContain('photo=4');
        completeBackground();
        await page.getByRole('button', { name: 'Go to photo 4', exact: true }).click();
        expect(mainImage().src).toBe(warmed?.src);
        expect(mainImage().sizes).toBe(warmed?.size);
    });

    it('starts no queued requests after closing and skips preloading when data saving is enabled', async () => {
        await LoadingSequence.run();
        completeMain();
        await userEvent.keyboard('{Escape}');
        await settleNavigation();
        expect(backgroundRequests()).toHaveLength(0);
        Object.defineProperty(navigator, 'connection', { configurable: true, value: { saveData: true } });
        await LoadingSequence.run();
        completeMain();
        await settleNavigation();
        expect(backgroundRequests()).toHaveLength(0);
    });

    it('does not retry failed neighbors or start speculation when the main image fails', async () => {
        await LoadingSequence.run();
        mainImage().dispatchEvent(new Event('error'));
        await settleNavigation();
        expect(backgroundRequests()).toHaveLength(0);
        expect(mainImage().parentElement?.querySelector('img[sizes="56px"]')).not.toBeNull();
        completeMain();
        await expect.poll(() => backgroundRequests().length).toBe(1);
        completeBackground('error');
        await expect.poll(() => backgroundRequests().length).toBe(2);
        expect(backgroundRequests()[1]?.src).toContain('photo=6');
        completeBackground('error');
        await settleNavigation();
        expect(backgroundRequests()).toHaveLength(2);
    });

    it('only increases the selected image resolution on zoom', async () => {
        await LoadingSequence.run();
        completeMain();
        const fittedSize = Number.parseFloat(mainImage().sizes);
        await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
        expect(Number.parseFloat(mainImage().sizes)).toBeCloseTo(fittedSize * 2, 0);
        expect(backgroundRequests()).toHaveLength(0);
    });
});
