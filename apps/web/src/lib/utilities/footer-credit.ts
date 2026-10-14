import { DateTime } from 'luxon';
import { presentationCopy } from '@/i18n/presentation';

/** Keeps custom CMS credits editable while updating legacy boilerplate without a migration. */
export const formatFooterCredit = (template: string | null | undefined, now: Date = new Date()): string => {
    const year = DateTime.fromJSDate(now).setZone('Europe/Copenhagen').toFormat('yyyy');
    const credit = template?.trim();
    const isLegacyNotice = credit && /all rights reserved|alle rettigheder forbeholdes/i.test(credit);
    const selectedTemplate = !credit || isLegacyNotice ? presentationCopy.footerTemplate : credit;
    return selectedTemplate.replaceAll('{year}', year);
};
