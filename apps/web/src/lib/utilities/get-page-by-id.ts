import { unstable_cache } from 'next/cache';
import { draftMode } from 'next/headers';
import { defaultLocale, type Locale } from '@/i18n/localized-collections';
import { initPayload } from '../config';

const getPageById = async ({ id, locale }: { id: string; locale?: Locale }) => {
    const { isEnabled: draft } = await draftMode();

    const localeToUse = locale ?? defaultLocale;

    const getResult = unstable_cache(
        async (draft: boolean) => {
            const payload = await initPayload();
            return payload.find({
                collection: 'pages',
                draft,
                limit: 1,
                locale: localeToUse,
                pagination: false,
                overrideAccess: draft,
                where: {
                    id: {
                        equals: id,
                    },
                    publishStatus: {
                        equals: 'public',
                    },
                },
            });
        },
        ['page-by-id', id, localeToUse],
        { tags: [`page-by-id_${id}`, `page-by-id_${id}_${localeToUse}`] },
    );

    const result = await getResult(draft);

    return result.docs?.[0] || null;
};

export default getPageById;
