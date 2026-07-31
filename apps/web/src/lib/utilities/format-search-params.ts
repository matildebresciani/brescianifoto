export const buildQueryString = (searchParams?: { [key: string]: string | string[] | undefined }) => {
    if (!searchParams) return '';

    const urlSearchParams = new URLSearchParams();

    Object.entries(searchParams).forEach(([key, value]) => {
        if (value === undefined) return;

        if (Array.isArray(value)) {
            value.forEach((item) => urlSearchParams.append(key, item));
        } else {
            urlSearchParams.append(key, value);
        }
    });

    const queryString = urlSearchParams.toString();
    return queryString ? `?${queryString}` : null;
};
