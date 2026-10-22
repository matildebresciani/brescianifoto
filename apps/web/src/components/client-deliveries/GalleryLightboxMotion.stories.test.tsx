import { composeStories } from '@storybook/react';
import type { ComponentProps } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cdp, page, userEvent } from 'vitest/browser';
import * as stories from './GalleryLightbox.stories';
import '@/app/(frontend)/globals.css';

vi.mock('next/image', () => ({
    __esModule: true,
    default: ({
        fill,
        priority,
        onLoad,
        onError,
        ...props
    }: ComponentProps<'img'> & { fill?: boolean; priority?: boolean }) => (
        // biome-ignore lint/performance/noImgElement: Hold main-photo completion independently of the browser cache.
        <img
            {...props}
            alt={props.alt}
            style={fill ? { position: 'absolute', inset: 0, width: '100%', height: '100%' } : props.style}
            onLoad={(event) => {
                if (props.fetchPriority !== 'high' || !event.isTrusted) onLoad?.(event);
            }}
            onError={(event) => {
                if (!event.isTrusted) onError?.(event);
            }}
        />
    ),
}));

const { MultipleSections } = composeStories(stories);

function currentSlide() {
    const slide = document.querySelector('[data-lightbox-slide]:not([inert])');
    if (!(slide instanceof HTMLElement)) throw new Error('Current slide is missing');
    return slide;
}

function settlePhoto(type = 'load') {
    const photo = currentSlide().querySelector('img[fetchpriority="high"]');
    if (!photo) throw new Error('Current photo is missing');
    photo.dispatchEvent(new Event(type));
}

beforeEach(async () => {
    await page.viewport(1200, 800);
    await cdp().send('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
    });
});

afterEach(async () => {
    await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe('delivery lightbox transitions', () => {
    it('keeps an opaque photo behind every frame of the replacement fade', async () => {
        await MultipleSections.run();
        await page.getByRole('button', { name: 'Åbn billede 1: Concert stage', exact: true }).click();
        settlePhoto();
        const previous = currentSlide();
        await expect.poll(() => getComputedStyle(previous).opacity).toBe('1');
        await page.getByRole('button', { name: 'Næste billede', exact: true }).click();
        const incoming = currentSlide();
        const photo = incoming.querySelector('img');
        if (!photo) throw new Error('Incoming photo is missing');
        settlePhoto();
        const frames: { backing: string; photo: string }[] = [];
        await new Promise<void>((resolve) => {
            const sample = () => {
                if (!previous.isConnected) {
                    resolve();
                    return;
                }
                frames.push({
                    backing: getComputedStyle(previous).opacity,
                    photo: getComputedStyle(photo).opacity,
                });
                requestAnimationFrame(sample);
            };
            requestAnimationFrame(sample);
        });
        expect(frames.length).toBeGreaterThan(0);
        expect(frames.every((frame) => frame.backing === '1' && frame.photo === '1')).toBe(true);
        expect(getComputedStyle(photo).transitionProperty).not.toContain('opacity');
        await expect.poll(() => getComputedStyle(incoming).opacity).toBe('1');
    });

    it('holds the previous photo until its replacement has finished fading in', async () => {
        await MultipleSections.run();
        await page.getByRole('button', { name: 'Åbn billede 1: Concert stage', exact: true }).click();
        settlePhoto();
        const previous = currentSlide();
        await expect.poll(() => getComputedStyle(previous).opacity).toBe('1');
        await page.getByRole('button', { name: 'Næste billede', exact: true }).click();
        expect(previous.inert).toBe(true);
        expect(previous.getAttribute('aria-hidden')).toBe('true');
        expect(getComputedStyle(previous).opacity).toBe('1');
        expect(getComputedStyle(currentSlide()).opacity).toBe('0');
        settlePhoto();
        await expect.poll(() => previous.isConnected).toBe(false);
        await expect.poll(() => getComputedStyle(currentSlide()).opacity).toBe('1');
        expect(document.querySelectorAll('[data-lightbox-slide]')).toHaveLength(1);
    });

    it('keeps a ready photo visible through rapid navigation and exposes a failed replacement for retry', async () => {
        await MultipleSections.run();
        await page.getByRole('button', { name: 'Åbn billede 1: Concert stage', exact: true }).click();
        settlePhoto();
        const previous = currentSlide();
        await page.getByRole('button', { name: 'Næste billede', exact: true }).click();
        await page.getByRole('button', { name: 'Næste billede', exact: true }).click();
        expect(previous.isConnected).toBe(true);
        expect(getComputedStyle(previous).opacity).toBe('1');
        expect(currentSlide().querySelector('img')?.alt).toBe('Crowd');
        settlePhoto('error');
        await expect.element(page.getByRole('button', { name: 'Prøv igen', exact: true })).toBeVisible();
        await page.getByRole('button', { name: 'Prøv igen', exact: true }).click();
        settlePhoto();
        await expect.poll(() => document.querySelectorAll('[data-lightbox-slide]').length).toBe(1);
        await expect.poll(() => currentSlide().querySelector('[data-lightbox-skeleton]')).toBeNull();
    });

    it('keeps focus and scroll locked until the closing fade finishes', async () => {
        await MultipleSections.run();
        const opener = page.getByRole('button', { name: 'Åbn billede 1: Concert stage', exact: true });
        await opener.click();
        await expect.poll(() => getComputedStyle(page.getByRole('dialog').element()).opacity).toBe('1');
        await userEvent.keyboard('{Escape}');
        expect(document.body.style.overflow).toBe('hidden');
        await expect.poll(() => document.querySelector('[role="dialog"]')).toBeNull();
        expect(document.activeElement).toBe(opener.element());
        expect(document.body.style.overflow).not.toBe('hidden');
    });

    it('shows static photo changes and restores focus with reduced motion', async () => {
        await cdp().send('Emulation.setEmulatedMedia', {
            features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
        });
        await MultipleSections.run();
        const opener = page.getByRole('button', { name: 'Åbn billede 1: Concert stage', exact: true });
        await opener.click();
        settlePhoto();
        await page.getByRole('button', { name: 'Næste billede', exact: true }).click();
        settlePhoto();
        await expect.poll(() => document.querySelectorAll('[data-lightbox-slide]').length).toBe(1);
        expect(getComputedStyle(currentSlide()).opacity).toBe('1');
        await userEvent.keyboard('{Escape}');
        await expect.poll(() => document.querySelector('[role="dialog"]')).toBeNull();
        expect(document.activeElement).toBe(opener.element());
    });
});
