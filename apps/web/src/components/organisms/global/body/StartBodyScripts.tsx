import parse, { type DOMNode, type HTMLReactParserOptions } from 'html-react-parser';
import { parseScriptTag } from '@/lib/utilities/parse-script-tag';
import type { Option } from '@/payload-types';

type Props = {
    scripts: Option['scriptInjection'];
};

const StartBodyScripts = ({ scripts }: Props) => {
    const options: HTMLReactParserOptions = {
        trim: true,
        replace: (domNode: DOMNode) => parseScriptTag(domNode),
    };
    return <>{scripts?.bodyScript && parse(scripts.bodyScript, options)}</>;
};

export default StartBodyScripts;
