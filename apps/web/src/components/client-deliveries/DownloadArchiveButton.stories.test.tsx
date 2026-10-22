import { composeStories } from '@storybook/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cdp, page } from 'vitest/browser';
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

beforeEach(() => {
    vi.stubGlobal('fetch', fetchDownload);
    fetchDownload.mockReset();
});

afterEach(async () => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe('gallery archive download', () => {
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
        await page.getByRole('button', { name: /Download all/ }).click();
        const preparing = page.getByRole('button', { name: /Preparing/ });
        await expect.element(preparing).toBeDisabled();
        await expect.element(preparing).toHaveAttribute('aria-busy', 'true');
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
        await expect.element(page.getByRole('button', { name: /Download again/ })).toBeEnabled();
        expect(transfer).toHaveBeenCalledTimes(1);
        expect(transfers).toEqual([
            { href: 'https://storage.example.test/gallery.zip', referrerPolicy: 'no-referrer' },
        ]);
        await expect
            .element(page.getByRole('status'))
            .toHaveTextContent('Download started. Follow progress in your browser');
    });

    it('reports errors and allows a retry without navigating away from the gallery', async () => {
        fetchDownload.mockResolvedValueOnce(new Response('Not found', { status: 404 }));
        fetchDownload.mockRejectedValueOnce(new TypeError('Network unavailable'));
        const transfer = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
        await Ready.run();
        await page.getByRole('button', { name: /Download all/ }).click();
        await expect.element(page.getByRole('status')).toBeVisible();
        await expect.element(page.getByRole('status')).toHaveTextContent('Could not start the download');
        await expect.element(page.getByRole('button', { name: /Download all/ })).toBeEnabled();
        await page.getByRole('button', { name: /Download all/ }).click();
        await expect.element(page.getByRole('button', { name: /Download all/ })).toBeEnabled();
        expect(fetchDownload).toHaveBeenCalledTimes(2);
        expect(transfer).not.toHaveBeenCalled();
    });

    it('does not hand malformed download responses to the browser', async () => {
        fetchDownload.mockResolvedValueOnce(Response.json({ url: 'javascript:alert(1)' }));
        const transfer = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
        await Ready.run();
        await page.getByRole('button', { name: /Download all/ }).click();
        await expect.element(page.getByRole('status')).toHaveTextContent('Could not start the download');
        expect(transfer).not.toHaveBeenCalled();
    });

    it('has a native disabled state that cannot start a request', async () => {
        await Disabled.run();
        const button = page.getByRole('button', { name: /Download all/ });
        await expect.element(button).toBeDisabled();
        const element = button.element();
        if (element instanceof HTMLButtonElement) element.click();
        expect(fetchDownload).not.toHaveBeenCalled();
    });

    it.each([320, 768, 1440])('fits the section menu and uses mono text at %ipx', async (width) => {
        await page.viewport(width, 800);
        await WithDownload.run();
        const button = page.getByRole('button', { name: /Download all/ }).element();
        const rect = button.getBoundingClientRect();
        expect(rect.left).toBeGreaterThanOrEqual(0);
        expect(rect.right).toBeLessThanOrEqual(width);
        expect(rect.height).toBeGreaterThanOrEqual(48);
        expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(width);
        const styles = getComputedStyle(button);
        expect(styles.fontFamily).toMatch(/IBM Plex Mono/);
        expect(styles.textTransform).toBe('uppercase');
        expect(styles.transitionDuration).toBe('0.36s');
    });

    it('keeps loading readable without spinning when reduced motion is enabled', async () => {
        await cdp().send('Emulation.setEmulatedMedia', {
            features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
        });
        const pending = pendingResponse();
        fetchDownload.mockReturnValueOnce(pending.promise);
        await Ready.run();
        await page.getByRole('button', { name: /Download all/ }).click();
        const button = page.getByRole('button', { name: /Preparing/ }).element();
        const spinner = button.querySelector('.animate-spin');
        expect(spinner).not.toBeNull();
        if (spinner) expect(getComputedStyle(spinner).animationName).toBe('none');
        expect(getComputedStyle(button).transitionProperty).toBe('none');
        pending.resolve(new Response(null, { status: 503 }));
        await expect.element(page.getByRole('button', { name: /Download all/ })).toBeEnabled();
    });
});
