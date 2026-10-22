'use client';

import type { UIFieldClientProps } from 'payload';
import { resolveSectionTheme, sectionColorIssues, themeIssues } from '@/lib/client-deliveries/theme';
import { useGalleryTheme, useSectionColors } from './theme-form';

export function SectionColorFeedback({ path }: UIFieldClientProps) {
    const prefix = path.slice(0, path.lastIndexOf('.'));
    const { parsed, theme } = useGalleryTheme();
    const colors = useSectionColors(prefix);
    const references = sectionColorIssues(theme, colors);
    const resolved = resolveSectionTheme(theme, colors).theme;
    const issues = parsed.success
        ? [...references, ...themeIssues(resolved)]
        : ['Complete the gallery palette to check section contrast.'];
    return <div aria-live="polite">{issues.length > 0 && <p>{issues.join(' ')}</p>}</div>;
}
