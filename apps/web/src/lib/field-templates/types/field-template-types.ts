import type { FieldBase } from 'payload';

export type PayloadBaseProps = Partial<{
    required: boolean;
    localized: boolean;
}>;

export type PayloadNamingProps = Partial<{
    name: string;
    label: string;
}>;

export type PayloadLinkProps = Partial<{
    required: boolean;
    localized: boolean;
    name: string;
    label: string;
    admin?: FieldBase['admin']; // add type here
}>;

export type PayloadTranslationProps = {
    name: string;
    label: string;
    defaultValue: string;
};
