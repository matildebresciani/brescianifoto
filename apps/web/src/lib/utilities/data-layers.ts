import { sendGTMEvent } from '@next/third-parties/google';
import { isSameObject } from './compare-objects';

// biome-ignore lint: intended any
const isUniqueLayer = (newEvent: Record<string, any>) => {
    const lastEvent = window.dataLayer?.[window.dataLayer.length - 1];
    if (typeof lastEvent === 'object' && isSameObject(lastEvent, newEvent)) return false;

    return true;
};

const submitGTMEvent = (event: string) => {
    const GTMEvent = {
        event,
        _clear: true,
    };

    if (!isUniqueLayer(GTMEvent)) return;

    sendGTMEvent(GTMEvent);
};

export const testLayer = () => {
    submitGTMEvent('test_layer');
};
