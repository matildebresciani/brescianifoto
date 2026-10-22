'use client';

import { Download, LoaderCircle } from 'lucide-react';
import { ResultAsync } from 'neverthrow';
import { useId, useRef, useState } from 'react';
import { z } from 'zod';
import { formatBytes } from '@/lib/client-deliveries/shared';
import { RollingButtonLabel } from './RollingButtonLabel';

const downloadResponse = z.object({ url: z.url({ protocol: /^https?$/ }) });

/** Prepares a signed ZIP link, then hands the transfer to the browser without buffering the file. */
export function DownloadArchiveButton({
    href,
    byteSize,
    isDisabled = false,
}: {
    href: string;
    byteSize: number;
    isDisabled?: boolean;
}) {
    const [state, setState] = useState<'idle' | 'preparing' | 'started' | 'error'>('idle');
    const isPending = useRef(false);
    const statusId = useId();
    const isPreparing = state === 'preparing';
    const hasError = state === 'error';

    async function startDownload() {
        if (isDisabled || isPending.current) return;
        isPending.current = true;
        setState('preparing');
        const response = await ResultAsync.fromPromise(
            fetch(href, {
                headers: { Accept: 'application/json' },
                cache: 'no-store',
                signal: AbortSignal.timeout(30_000),
            }).then(async (result): Promise<unknown> => (result.ok ? result.json() : null)),
            () => 'Download unavailable',
        );
        const parsed = downloadResponse.safeParse(response.isOk() ? response.value : null);
        isPending.current = false;
        if (!parsed.success) {
            setState('error');
            return;
        }
        // Storage supplies Content-Disposition: attachment; the browser owns transfer progress from here.
        const link = document.createElement('a');
        link.href = parsed.data.url;
        link.referrerPolicy = 'no-referrer';
        document.body.append(link);
        link.click();
        link.remove();
        setState('started');
    }

    const label = isPreparing ? 'Klargør…' : 'Download';
    const status = hasError
        ? 'Download kunne ikke startes. Prøv igen, eller genindlæs galleriet.'
        : state === 'started'
          ? 'Download er startet. Følg overførslen i din browsers downloads.'
          : isPreparing
            ? 'Klargør dine billeder til download.'
            : '';

    return (
        <div className="relative shrink-0">
            <button
                type="button"
                className="delivery-download metadata focus-ring inline-flex min-h-12 items-center justify-center gap-xs rounded-[var(--btn-radius)] border border-bg-invert bg-bg-invert px-xs py-xs text-fg-on-color transition-[background-color,color,border-color] duration-[360ms] ease-[var(--delivery-ease)] enabled:cursor-pointer disabled:cursor-not-allowed disabled:border-border-base disabled:bg-bg-subtle disabled:text-fg-subtle aria-busy:cursor-wait motion-reduce:transition-none md:px-base"
                disabled={isDisabled || isPreparing}
                aria-busy={isPreparing}
                aria-describedby={statusId}
                onClick={startDownload}
            >
                <span className="relative size-4 shrink-0 overflow-hidden" aria-hidden="true">
                    {isPreparing ? (
                        <span className="block animate-spin motion-reduce:animate-none">
                            <LoaderCircle size={16} strokeWidth={1.5} aria-hidden="true" />
                        </span>
                    ) : (
                        <>
                            <span className="delivery-download-icon block">
                                <Download size={16} strokeWidth={1.5} aria-hidden="true" />
                            </span>
                            <span className="delivery-download-icon absolute -top-full left-0 block">
                                <Download size={16} strokeWidth={1.5} aria-hidden="true" />
                            </span>
                        </>
                    )}
                </span>
                <span className="flex items-center gap-xs">
                    <RollingButtonLabel label={label} reservedLabel="Download" className="hidden md:grid" />
                    <span className="whitespace-nowrap md:border-l md:border-current/30 md:pl-xs">
                        {formatBytes(byteSize)}
                    </span>
                </span>
            </button>
            <output
                id={statusId}
                className={
                    hasError
                        ? 'body-xs absolute top-full right-0 z-10 mt-xs w-[min(20rem,80vw)] border border-border-base bg-bg-base p-base text-fg-base'
                        : 'sr-only'
                }
            >
                {status}
            </output>
        </div>
    );
}
