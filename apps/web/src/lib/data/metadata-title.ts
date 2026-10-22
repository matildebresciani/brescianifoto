import type { Metadata } from 'next';

/** Apply the shared prefix once, including to titles saved with older brand suffixes. */
export function formatPageTitle(value: string): string {
    const title = value
        .trim()
        .replace(/^(?:brescianifoto\s*[|·—–-]\s*)+/i, '')
        .replace(/(?:\s*[|·—–-]\s*brescianifoto)+$/i, '')
        .trim();
    return title && !/^brescianifoto$/i.test(title) ? `brescianifoto | ${title}` : 'brescianifoto';
}

/** Keep explicit social titles aligned without replacing inherited fallback images or disabled previews. */
export function withPageTitle(metadata: Metadata, value: string): Metadata {
    const title = formatPageTitle(value);
    return {
        ...metadata,
        title,
        ...(metadata.openGraph ? { openGraph: { ...metadata.openGraph, title } } : {}),
        ...(metadata.twitter ? { twitter: { ...metadata.twitter, title } } : {}),
    };
}
