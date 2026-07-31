import { type DOMNode, domToReact } from 'html-react-parser';
import Script from 'next/script';

export const parseScriptTag = (domNode: DOMNode) => {
    if (!('type' in domNode) || domNode.type !== 'script') return null;

    const { attribs, children } = domNode;

    return (
        <Script id={attribs.id || `script-${Math.random().toString(36).slice(2)}`} strategy="lazyOnload" {...attribs}>
            {
                // biome-ignore lint: html-react-parser documentation tells us to use type assertion here
                domToReact(children as DOMNode[])
            }
        </Script>
    );
};
