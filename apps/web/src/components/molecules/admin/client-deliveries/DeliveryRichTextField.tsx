import { RscEntryLexicalField } from '@payloadcms/richtext-lexical/rsc';
import type { ComponentProps } from 'react';
import { archivo, ibmPlexMono, instrumentSerif } from '@/lib/styles/fonts';
import '@/lib/client-deliveries/typography.css';

/** Scope the site's font variables to this editor, leaving the surrounding Payload interface alone. */
export function DeliveryRichTextField(props: ComponentProps<typeof RscEntryLexicalField>) {
    return (
        <div className={`delivery-editor ${archivo.variable} ${ibmPlexMono.variable} ${instrumentSerif.variable}`}>
            <RscEntryLexicalField {...props} />
        </div>
    );
}
