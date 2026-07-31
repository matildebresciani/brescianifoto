import type { GlobalAfterChangeHook } from 'payload';
import { formatSlug } from '@/components/molecules/admin/fields/slug/formatSlug';

const collection = 'pages';

// biome-ignore lint: doc and previousDoc are type any from PayloadCMS #sadge
const getId = (field: any): string | undefined => {
    if (!field) return undefined;
    return typeof field === 'object' ? field.id : field;
};

export const changeHomepage: GlobalAfterChangeHook = async ({ doc, previousDoc, req }) => {
    const { payload } = req;

    const previousHomepageId = getId(previousDoc.defaultPages?.homepage);
    const currentHomepageId = getId(doc.defaultPages?.homepage);

    // Checking if homepage has been changed
    if (previousHomepageId !== currentHomepageId) {
        if (previousHomepageId) {
            // Fetch the old homepage title and prepare a new slug
            const prevPage = await payload.findByID({
                collection,
                id: previousHomepageId,
                req,
            });

            if (prevPage) {
                // Add new slug to old homepage
                const slug = formatSlug(prevPage.title);
                await payload.update({
                    collection,
                    id: previousHomepageId,
                    data: {
                        slug: slug,
                    },
                    context: {
                        skipHomepageEnforcement: true,
                    },
                    req,
                });
            }
        }

        if (currentHomepageId) {
            await payload.update({
                collection,
                id: currentHomepageId,
                data: {
                    slug: '/',
                },
                context: {
                    skipHomepageEnforcement: true,
                },
                req,
            });
        }
    }
};
