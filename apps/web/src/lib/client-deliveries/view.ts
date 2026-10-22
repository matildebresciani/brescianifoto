import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import type { DeliveryTheme } from './shared';

/** Supported gallery-wide spacing choices, in CSS pixels. */
export type PhotoSpacing = 0 | 2 | 4 | 8;

export type DeliveryPhoto = {
    id: string;
    src: string;
    imageVersion: string;
    width: number;
    height: number;
    name: string;
    createdAt: string;
    updatedAt: string;
    downloadHref?: string;
};
export type DeliveryBlock = { theme: DeliveryTheme; hasCustomColors: boolean } & (
    | { id: string; type: 'text'; content: SerializedEditorState }
    | {
          id: string;
          type: 'photos';
          anchor: string;
          menuLabel: string;
          photos: DeliveryPhoto[];
          introduction?: SerializedEditorState | null;
      }
);
export type DeliveryView = {
    title: string;
    date?: string | null;
    location?: string | null;
    details?: SerializedEditorState | null;
    cover?: DeliveryPhoto;
    coverLayout: 'editorial' | 'overlay';
    desktopColumns: 3 | 4;
    photoSpacing: PhotoSpacing;
    overlayColor: string;
    overlayOpacity: number;
    alignment: 'left' | 'center' | 'right';
    focalX: number;
    focalY: number;
    theme: DeliveryTheme;
    blocks: DeliveryBlock[];
    archive?: { href: string; byteSize: number };
    isPreview: boolean;
    photoCount: number;
};
