import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

/** Convert legacy plain text without interpreting HTML or losing blank lines. */
export function detailsFromText(text: string): SerializedEditorState {
    return {
        root: {
            type: 'root',
            version: 1,
            direction: null,
            format: '',
            indent: 0,
            children: text.split(/\r\n|\r|\n/).map((line) => ({
                type: 'paragraph',
                version: 1,
                direction: null,
                format: '',
                indent: 0,
                children: line
                    ? [{ type: 'text', version: 1, text: line, format: 0, detail: 0, mode: 'normal', style: '' }]
                    : [],
            })),
        },
    };
}

/** Safe to use on reads, writes and repeated migrations, including restored versions. */
export function normalizeDetails<T>(value: T): Exclude<T, string> | SerializedEditorState;
export function normalizeDetails(value: unknown): unknown {
    return typeof value === 'string' ? detailsFromText(value) : value;
}
