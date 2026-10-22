'use client';

import { themeIssues } from '@/lib/client-deliveries/theme';
import { useGalleryTheme } from './theme-form';

export function ThemeFeedback() {
    const { parsed, theme } = useGalleryTheme();
    const issues = parsed.success ? themeIssues(theme) : ['Use six-digit hex colors.'];
    return <div aria-live="polite">{issues.length > 0 && <p>{issues.join(' ')}</p>}</div>;
}
