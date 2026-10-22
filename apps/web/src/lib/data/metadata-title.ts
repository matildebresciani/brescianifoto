import type { Metadata } from 'next';
import type { Option } from '@/payload-types';

/** Apply Payload's localized affixes once, including to previously branded titles. */
export function formatPageTitle(value: string, settings: Option['meta'] | null): string {
    const prefix = settings?.metaTitlePrefix ?? '';
    const suffix = settings?.metaTitleSuffix ?? '';
    const affixes = [...new Set([prefix, suffix].map((affix) => affix.replace(/^[\s|·—–:-]+|[\s|·—–:-]+$/g, '')))];
    let title = value.trim();

    for (const affix of affixes.filter(Boolean)) {
        const escaped = affix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        title = title
            .replace(new RegExp(`^(?:${escaped}\\s*[|·—–:-]\\s*)+`, 'i'), '')
            .replace(new RegExp(`(?:\\s*[|·—–:-]\\s*${escaped})+$`, 'i'), '')
            .trim();
    }

    const standaloneAffix = affixes.find((affix) => affix && title.toLowerCase() === affix.toLowerCase());
    if (standaloneAffix) return standaloneAffix;
    if (!title) return affixes.filter(Boolean).join(' | ');
    return `${prefix}${title}${suffix}`.trim();
}

/** Keep explicit social titles aligned without replacing inherited fallback images or disabled previews. */
export function withPageTitle(metadata: Metadata, value: string, settings: Option['meta']): Metadata {
    const title = formatPageTitle(value, settings);
    return {
        ...metadata,
        title,
        ...(metadata.openGraph ? { openGraph: { ...metadata.openGraph, title } } : {}),
        ...(metadata.twitter ? { twitter: { ...metadata.twitter, title } } : {}),
    };
}
