import { composeStories } from '@storybook/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cdp, page, userEvent } from 'vitest/browser';
import * as stories from './DownloadArchiveButton.stories';
import * as menuStories from './SectionMenu.stories';

const { Ready, Disabled } = composeStories(stories);
const { WithDownload } = composeStories(menuStories);
const fetchDownload = vi.fn<typeof fetch>();

function pendingResponse() {
    let resolve: (response: Response) => void = () => {};
    const promise = new Promise<Response>((complete) => {
        resolve = complete;
    });
    return { promise, resolve };
}

beforeEach(async () => {
    await page.viewport(1280, 800);
    vi.stubGlobal('fetch', fetchDownload);
    fetchDownload.mockReset();
});

afterEach(async () => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe('gallery archive download', () => {
    it('rolls the label and icon on hover without changing the fill or button size', async () => {
        await cdp().send('Emulation.setEmulatedMedia', {
            features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
        });
        await Ready.run();
        const button = page.getByRole('button', { name: /Hent alle/ });
        const element = button.element();
        const bounds = element.getBoundingClientRect();
        const background = getComputedStyle(element).backgroundColor;
        const character = element.querySelector('.delivery-download-character');
        const icon = element.querySelector('.delivery-download-icon');
        if (!character || !icon) throw new Error('Rolling label or icon is missing');
        const translateY = (target: Element) => new DOMMatrixReadOnly(getComputedStyle(target).transform).m42;
        await button.hover();
        await expect
            .poll(() => Math.round(translateY(character)))
            .toBe(-Math.round(character.getBoundingClientRect().height));
        await expect.poll(() => translateY(icon)).toBe(16);
        expect(getComputedStyle(element).backgroundColor).toBe(background);
        expect(element.getBoundingClientRect().width).toBe(bounds.width);
        expect(element.getBoundingClientRect().height).toBe(bounds.height);
        await cdp().send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 500, y: 300 });
        await expect.poll(() => translateY(character)).toBe(0);
        await expect.poll(() => translateY(icon)).toBe(0);
    });

    it('offers the same rolling feedback for keyboard focus with a single accessible label', async () => {
        await Ready.run();
        await userEvent.tab();
        const button = page.getByRole('button', { name: 'Hent alle 2.2 GB', exact: true });
        await expect.element(button).toHaveFocus();
        const icon = button.element().querySelector('.delivery-download-icon');
        if (!icon) throw new Error('Rolling icon is missing');
        await expect.poll(() => new DOMMatrixReadOnly(getComputedStyle(icon).transform).m42).toBe(16);
    });

    it('disables repeat clicks while preparing and hands only the signed URL to the browser', async () => {
        const pending = pendingResponse();
        fetchDownload.mockReturnValueOnce(pending.promise);
        const transfers: { href: string; referrerPolicy: string }[] = [];
        const transfer = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
            this: HTMLAnchorElement,
        ) {
            transfers.push({ href: this.href, referrerPolicy: this.referrerPolicy });
        });
        await Ready.run();
        await page.getByRole('button', { name: /Hent alle/ }).click();
        const preparing = page.getByRole('button', { name: /Klargør/ });
        await expect.element(preparing).toBeDisabled();
        await expect.element(preparing).toHaveAttribute('aria-busy', 'true');
        for (const character of preparing.element().querySelectorAll('.delivery-download-character')) {
            expect(getComputedStyle(character).transform).toBe('none');
            expect(getComputedStyle(character).transitionProperty).toBe('none');
        }
        expect(fetchDownload).toHaveBeenCalledTimes(1);
        expect(fetchDownload).toHaveBeenCalledWith(
            stories.default.args?.href,
            expect.objectContaining({
                headers: { Accept: 'application/json' },
                cache: 'no-store',
            }),
        );
        expect(transfer).not.toHaveBeenCalled();
        pending.resolve(Response.json({ url: 'https://storage.example.test/gallery.zip' }));
        await expect.element(page.getByRole('button', { name: /Hent igen/ })).toBeEnabled();
        expect(transfer).toHaveBeenCalledTimes(1);
        expect(transfers).toEqual([
            { href: 'https://storage.example.test/gallery.zip', referrerPolicy: 'no-referrer' },
        ]);
        await expect
            .element(page.getByRole('status'))
            .toHaveTextContent('Download er startet. Følg overførslen i din browser');
    });

    it('reports errors and allows a retry without navigating away from the gallery', async () => {
        fetchDownload.mockResolvedValueOnce(new Response('Not found', { status: 404 }));
        fetchDownload.mockRejectedValueOnce(new TypeError('Network unavailable'));
        const transfer = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
        await Ready.run();
        await page.getByRole('button', { name: /Hent alle/ }).click();
        await expect.element(page.getByRole('status')).toBeVisible();
        await expect.element(page.getByRole('status')).toHaveTextContent('Download kunne ikke startes');
        await expect.element(page.getByRole('button', { name: /Hent alle/ })).toBeEnabled();
        await page.getByRole('button', { name: /Hent alle/ }).click();
        await expect.element(page.getByRole('button', { name: /Hent alle/ })).toBeEnabled();
        expect(fetchDownload).toHaveBeenCalledTimes(2);
        expect(transfer).not.toHaveBeenCalled();
    });

    it('does not hand malformed download responses to the browser', async () => {
        fetchDownload.mockResolvedValueOnce(Response.json({ url: 'javascript:alert(1)' }));
        const transfer = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
        await Ready.run();
        await page.getByRole('button', { name: /Hent alle/ }).click();
        await expect.element(page.getByRole('status')).toHaveTextContent('Download kunne ikke startes');
        expect(transfer).not.toHaveBeenCalled();
    });

    it('has a native disabled state that cannot start a request', async () => {
        await Disabled.run();
        const button = page.getByRole('button', { name: /Hent alle/ });
        await expect.element(button).toBeDisabled();
        const element = button.element();
        await button.hover();
        for (const character of element.querySelectorAll('.delivery-download-character')) {
            expect(getComputedStyle(character).transform).toBe('none');
        }
        if (element instanceof HTMLButtonElement) element.click();
        expect(fetchDownload).not.toHaveBeenCalled();
    });

    it.each([320, 768, 1440])('fits the section menu and uses the shared UI typography at %ipx', async (width) => {
        await page.viewport(width, 800);
        await WithDownload.run();
        const button = page.getByRole('button', { name: /Hent alle/ }).element();
        const rect = button.getBoundingClientRect();
        expect(rect.left).toBeGreaterThanOrEqual(0);
        expect(rect.right).toBeLessThanOrEqual(width);
        expect(rect.height).toBeGreaterThanOrEqual(48);
        expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(width);
        const styles = getComputedStyle(button);
        expect(styles.fontFamily).toMatch(/Archivo/);
        expect(styles.textTransform).toBe('none');
        expect(styles.transitionDuration).toBe('0.36s');
    });

    it('keeps loading readable without spinning when reduced motion is enabled', async () => {
        await cdp().send('Emulation.setEmulatedMedia', {
            features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
        });
        const pending = pendingResponse();
        fetchDownload.mockReturnValueOnce(pending.promise);
        await Ready.run();
        await page.getByRole('button', { name: /Hent alle/ }).click();
        const button = page.getByRole('button', { name: /Klargør/ }).element();
        const spinner = button.querySelector('.animate-spin');
        expect(spinner).not.toBeNull();
        if (spinner) expect(getComputedStyle(spinner).animationName).toBe('none');
        expect(getComputedStyle(button).transitionProperty).toBe('none');
        pending.resolve(new Response(null, { status: 503 }));
        await expect.element(page.getByRole('button', { name: /Hent alle/ })).toBeEnabled();
        await page.getByRole('button', { name: /Hent alle/ }).hover();
        for (const part of button.querySelectorAll('.delivery-download-character, .delivery-download-icon')) {
            expect(getComputedStyle(part).transform).toBe('none');
            expect(getComputedStyle(part).transitionProperty).toBe('none');
        }
    });
});
