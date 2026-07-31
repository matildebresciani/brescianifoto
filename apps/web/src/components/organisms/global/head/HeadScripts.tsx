import { GoogleTagManager } from '@next/third-parties/google';
import parse, { type DOMNode, type HTMLReactParserOptions } from 'html-react-parser';
import { parseScriptTag } from '@/lib/utilities/parse-script-tag';
import type { Option } from '@/payload-types';

type Props = {
    scripts: Option['scriptInjection'];
};

const HeadScripts = ({ scripts }: Props) => {
    const options: HTMLReactParserOptions = {
        trim: true,
        replace: (domNode: DOMNode) => parseScriptTag(domNode),
    };

    return (
        <>
            {scripts?.headScript && parse(scripts.headScript, options)}
            {scripts?.gtmId && <GoogleTagManager gtmId={scripts.gtmId} />}
        </>
    );
};

export default HeadScripts;
