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
        quality,
        ...props
    }: ComponentProps<'img'> & { fill?: boolean; priority?: boolean; quality?: number }) => (
        // biome-ignore lint/performance/noImgElement: Exercise real browser layout without the Next.js optimizer.
        <img
            {...props}
            alt={alt}
            data-image-quality={quality}
            style={fill ? { ...style, position: 'absolute', inset: 0, width: '100%', height: '100%' } : style}
        />
    ),
}));

const { MultipleSections, SinglePhoto } = composeStories(stories);

async function tap(element: Element) {
    const rect = element.getBoundingClientRect();
    const frame = window.frameElement?.getBoundingClientRect();
    const x = rect.left + rect.width / 2 + (frame?.left ?? 0);
    const y = rect.top + rect.height / 2 + (frame?.top ?? 0);
    await cdp().send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    await cdp().send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

async function expectPhoto(name: string, count: string) {
    await expect.poll(() => document.querySelector('[role="dialog"] .metadata')?.textContent).toBe(count);
    await expect
        .poll(() =>
            document
                .querySelector(
                    '[role="dialog"] button[aria-pressed] img, [role="dialog"] button[aria-label="Billedvisning"] img',
                )
                ?.getAttribute('alt'),
        )
        .toBe(name);
}

beforeEach(async () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    await page.viewport(1200, 800);
    await cdp().send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
});

afterEach(async () => {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    await cdp().send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe('one lightbox for the complete client gallery', () => {
    it('uses quality 90 for the opened phone photo and its next-photo preload', async () => {
        await page.viewport(393, 852);
        await MultipleSections.run();
        await page.getByRole('button', { name: 'Åbn billede 1: Concert stage', exact: true }).click();
        await expect
            .poll(() => document.querySelector('[data-lightbox-slide] img')?.getAttribute('data-image-quality'))
            .toBe('90');
        await expect
            .poll(() =>
                document.querySelector('[role="dialog"] img[fetchpriority="low"]')?.getAttribute('data-image-quality'),
            )
            .toBe('90');
    });
    it('keeps mobile controls rectangular and centered after repeated touch taps, without instruction text', async () => {
        await page.viewport(390, 844);
        await cdp().send('Emulation.setTouchEmulationEnabled', { enabled: true });
        await cdp().send('Emulation.setEmulatedMedia', {
            features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
        });
        await MultipleSections.run();
        await page.getByRole('button', { name: 'Åbn billede 1: Concert stage', exact: true }).click();
        expect(page.getByRole('dialog').element().textContent).not.toContain('Stryg for at se flere');
        for (const control of document.querySelectorAll('.delivery-lightbox-control')) {
            const styles = getComputedStyle(control);
            if (styles.display === 'none') continue;
            expect(styles.borderRadius).toBe('2px');
            expect(control.getBoundingClientRect().width).toBe(48);
            expect(control.getBoundingClientRect().height).toBe(48);
        }
        const next = page.getByRole('button', { name: 'Næste billede', exact: true }).element();
        const previous = page.getByRole('button', { name: 'Forrige billede', exact: true }).element();
        const controls = [next, next, previous];
        const counts = ['2 / 3', '3 / 3', '2 / 3'];
        for (const [index, control] of controls.entries()) {
            await tap(control);
            await expect
                .poll(() => document.querySelector('[role="dialog"] .metadata')?.textContent)
                .toBe(counts[index]);
            const icon = control.querySelector('svg');
            if (!icon) throw new Error('Arrow is missing');
            const buttonBounds = control.getBoundingClientRect();
            const iconBounds = icon.getBoundingClientRect();
            expect(iconBounds.x + iconBounds.width / 2).toBeCloseTo(buttonBounds.x + buttonBounds.width / 2, 1);
            expect(iconBounds.y + iconBounds.height / 2).toBeCloseTo(buttonBounds.y + buttonBounds.height / 2, 1);
            expect(getComputedStyle(icon).translate).toBe('none');
            expect(control.matches(':active')).toBe(false);
            await expect.poll(() => getComputedStyle(control).backgroundColor).toBe('rgba(0, 0, 0, 0)');
        }
    });

    it('keeps the selection and keyboard focus on the current thumbnail after clicking and navigating', async () => {
        await MultipleSections.run();
        await page.getByRole('button', { name: 'Åbn billede 1: Concert stage', exact: true }).click();
        const clicked = page.getByRole('button', { name: 'Gå til billede 1', exact: true });
        await clicked.click();
        await userEvent.keyboard('{ArrowRight}');
        const selected = page.getByRole('button', { name: 'Gå til billede 2', exact: true });
        await expect.element(selected).toHaveAttribute('aria-current', 'true');
        await expect.element(selected).toHaveFocus();
        await expect.element(clicked).toHaveAttribute('aria-current', 'false');
        expect(getComputedStyle(clicked.element()).outlineWidth).toBe('0px');
        await clicked.hover();
        await expect
            .poll(() => getComputedStyle(clicked.element()).borderColor)
            .not.toBe(getComputedStyle(selected.element()).borderColor);
        expect(document.querySelectorAll('.lightbox-thumbnail[aria-current="true"]')).toHaveLength(1);
        await userEvent.keyboard('{ArrowRight}');
        await expect.element(page.getByRole('button', { name: 'Gå til billede 3', exact: true })).toHaveFocus();
        await userEvent.keyboard('{ArrowLeft}');
        await expect.element(selected).toHaveFocus();
    });

    it('crosses section boundaries, skips text and empty sections, and wraps across the whole gallery', async () => {
        await MultipleSections.run();
        await page.getByRole('button', { name: 'Åbn billede 2: Artist portrait', exact: true }).click();
        await expectPhoto('Artist portrait', '2 / 3');
        expect(document.querySelectorAll('[role="dialog"] [aria-label^="Gå til billede "]')).toHaveLength(3);
        await expect
            .element(page.getByRole('link', { name: 'Download originalbillede' }))
            .toHaveAttribute('href', '/downloads/artist');
        await page.getByRole('button', { name: 'Næste billede', exact: true }).click();
        await expectPhoto('Crowd', '3 / 3');
        await expect.element(page.getByRole('link', { name: 'Download originalbillede' })).not.toBeInTheDocument();
        await userEvent.keyboard('{ArrowRight}');
        await expectPhoto('Concert stage', '1 / 3');
        await userEvent.keyboard('{ArrowLeft}');
        await expectPhoto('Crowd', '3 / 3');
        await page.getByRole('button', { name: 'Gå til billede 1', exact: true }).click();
        await expectPhoto('Concert stage', '1 / 3');
    });

    it('opens later-section photos at their global index and maps repeated photos to one slide', async () => {
        await MultipleSections.run();
        const opener = page.getByRole('button', { name: 'Åbn billede 1: Crowd', exact: true });
        await opener.click();
        await expectPhoto('Crowd', '3 / 3');
        const dialog = page.getByRole('dialog').element();
        expect(getComputedStyle(dialog).backgroundColor).toBe('rgb(250, 255, 239)');
        await page.getByRole('button', { name: 'Gå til billede 2', exact: true }).click();
        await expectPhoto('Artist portrait', '2 / 3');
        expect(getComputedStyle(dialog).backgroundColor).toBe('rgb(250, 255, 239)');
        await userEvent.keyboard('{Escape}');
        expect(document.activeElement).toBe(opener.element());
        await page.getByRole('button', { name: 'Åbn billede 2: Concert stage', exact: true }).click();
        await expectPhoto('Concert stage', '1 / 3');
        expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(1);
    });

    it('swipes from one section to the next on mobile', async () => {
        await page.viewport(390, 844);
        await MultipleSections.run();
        await page.getByRole('button', { name: 'Åbn billede 2: Artist portrait', exact: true }).click();
        await expectPhoto('Artist portrait', '2 / 3');
        await expect.element(page.getByRole('button', { name: 'Næste billede', exact: true })).toBeVisible();
        const photo = document.querySelector('[role="dialog"] button[aria-label="Billedvisning"]');
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
        await page.getByRole('button', { name: 'Åbn billede 1: Artist portrait', exact: true }).click();
        await expectPhoto('Artist portrait', '1 / 1');
        await expect.element(page.getByRole('button', { name: 'Næste billede', exact: true })).not.toBeInTheDocument();
        expect(document.querySelectorAll('[role="dialog"] [aria-label^="Gå til billede "]')).toHaveLength(0);
    });
});
