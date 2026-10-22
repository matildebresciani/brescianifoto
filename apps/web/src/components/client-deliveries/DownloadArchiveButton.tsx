'use client';

import { Download, LoaderCircle } from 'lucide-react';
import { ResultAsync } from 'neverthrow';
import { useId, useRef, useState } from 'react';
import { z } from 'zod';
import { formatBytes } from '@/lib/client-deliveries/shared';

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

    const label = isPreparing ? 'Preparing…' : state === 'started' ? 'Download again' : 'Download all';
    const status = hasError
        ? 'Could not start the download. Please try again or refresh the gallery.'
        : state === 'started'
          ? 'Download started. Follow progress in your browser’s downloads.'
          : isPreparing
            ? 'Preparing your gallery download.'
            : '';

    return (
        <div className="relative shrink-0">
            <button
                type="button"
                className="metadata focus-ring inline-flex min-h-12 items-center justify-center gap-xs rounded-[var(--btn-radius)] border border-bg-invert bg-bg-invert px-base py-xs text-fg-on-color transition-[background-color,color,border-color,opacity] duration-[360ms] ease-[var(--delivery-ease)] enabled:cursor-pointer enabled:hover:bg-bg-base enabled:hover:text-fg-base enabled:active:bg-bg-pressed disabled:cursor-not-allowed disabled:border-border-base disabled:bg-bg-subtle disabled:text-fg-subtle aria-busy:cursor-wait motion-reduce:transition-none"
                disabled={isDisabled || isPreparing}
                aria-busy={isPreparing}
                aria-describedby={statusId}
                onClick={startDownload}
            >
                <span className={`shrink-0${isPreparing ? ' animate-spin motion-reduce:animate-none' : ''}`}>
                    {isPreparing ? (
                        <LoaderCircle size={16} strokeWidth={1.5} aria-hidden="true" />
                    ) : (
                        <Download size={16} strokeWidth={1.5} aria-hidden="true" />
                    )}
                </span>
                <span className="flex flex-col items-start gap-2xs sm:flex-row sm:items-center sm:gap-xs">
                    <span className="grid text-left">
                        <span className="invisible col-start-1 row-start-1" aria-hidden="true">
                            Download again
                        </span>
                        <span className="col-start-1 row-start-1">{label}</span>
                    </span>
                    <span className="whitespace-nowrap sm:border-l sm:border-current/30 sm:pl-xs">
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
