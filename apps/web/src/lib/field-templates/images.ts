import type { Field } from 'payload';
import type { PayloadBaseProps } from './types/field-template-types';

export const payloadImage = (props: PayloadBaseProps = {}): Field => {
    const { required = false, localized = true } = props;

    return {
        type: 'upload',
        name: 'image',
        label: 'Image',
        relationTo: 'media',
        localized,
        required,
    };
};

export const payloadGallery = (props: PayloadBaseProps = {}): Field => {
    const { required = false, localized = true } = props;

    return {
        type: 'upload',
        name: 'gallery',
        label: 'Gallery',
        relationTo: 'media',
        hasMany: true,
        localized,
        required,
    };
};
