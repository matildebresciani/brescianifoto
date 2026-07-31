export const stringFormatting = (string: string) => {
    return string.replaceAll('[[', '<span class="highlight">').replaceAll(']]', '</span>');
};
