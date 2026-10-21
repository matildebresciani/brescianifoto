'use client';

import { useFormFields } from '@payloadcms/ui';
import { themeDefaults, themeIssues, themeSchema } from '@/lib/client-deliveries/shared';

export function ThemeFeedback() {
    const values = useFormFields(([fields]) =>
        Object.fromEntries(
            Object.entries(themeDefaults).map(([key, fallback]) => [key, fields[`theme.${key}`]?.value ?? fallback]),
        ),
    );
    const theme = themeSchema.safeParse(values);
    const issues = theme.success ? themeIssues(theme.data) : ['Enter six-digit hex colors to check contrast.'];
    return (
        <div aria-live="polite">
            <strong>Color contrast</strong>
            <p>{issues.length ? issues.join(' ') : 'Text and muted text meet 4.5:1 contrast on both surfaces.'}</p>
        </div>
    );
}
