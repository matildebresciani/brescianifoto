import type { StaticImageData } from 'next/image';
import type { ElementType, Ref } from 'react';
import type { Media as MediaType } from '@/payload-types';

export interface Props {
    alt?: string;
    className?: string;
    fill?: boolean; // for NextImage only
    htmlElement?: ElementType | null;
    onClick?: () => void;
    onLoad?: () => void;
    loading?: 'lazy' | 'eager'; // for NextImage only
    priority?: boolean; // for NextImage only
    ref?: Ref<HTMLImageElement | HTMLVideoElement | null>;
    resource?: string | MediaType | null | undefined; // for Payload media
    size?: string; // for NextImage only
    src?: StaticImageData; // for static media
    videoClassName?: string;
    quality?: number; // for NextImage only
    fetchPriority?: 'high' | 'low' | 'auto'; // for NextImage only
}
