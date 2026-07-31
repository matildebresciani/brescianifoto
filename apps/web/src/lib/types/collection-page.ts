export type CollectionPageType = {
    params: Promise<{
        slug?: string[];
        locale?: string;
    }>;
};

export type CollectionPostType = {
    params: Promise<{
        slug?: string;
        locale?: string;
    }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export type CollectionArchiveType = {
    params: Promise<{
        slug?: string[];
        locale?: string;
    }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};
