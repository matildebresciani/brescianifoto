import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mongooseAdapter } from '@payloadcms/db-mongodb';
import { resendAdapter } from '@payloadcms/email-resend';
import { da } from '@payloadcms/translations/languages/da';
import { en } from '@payloadcms/translations/languages/en';
import { buildConfig, type PayloadRequest } from 'payload';
import sharp from 'sharp';
import { defaultLexical } from '@/components/molecules/admin/fields/defaultLexical';
import { Icons } from './collections/assets/icons/config';
import { Media } from './collections/assets/media/config';
import { PostCategories } from './collections/categories/post-categories/config';
import { Pages } from './collections/content/pages/config';
import { Posts } from './collections/content/posts/config';
import { Faqs } from './collections/entries/faqs/config';
import { SavedLayouts } from './collections/entries/saved-layouts/config';
import { ApiKeys } from './collections/tools-settings/api-keys/config';
import { Navigation } from './collections/tools-settings/navigation/config';
import { Options } from './collections/tools-settings/options/config';
import { Redirects } from './collections/tools-settings/redirects/config';
import { Translations } from './collections/tools-settings/translations/config';
import { Users } from './collections/tools-settings/users/config';
import { defaultLocale, locales } from './i18n/localized-collections';
import { plugins } from './lib/plugins';
import { getServerSideURL } from './lib/utilities/get-url';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
    admin: {
        components: {
            afterDashboard: ['@/components/molecules/admin/AfterDashboard'],
        },
        importMap: {
            baseDir: path.resolve(dirname),
        },
        user: Users.slug,
        livePreview: {
            breakpoints: [
                {
                    label: 'Mobile',
                    name: 'mobile',
                    width: 375,
                    height: 667,
                },
                {
                    label: 'Tablet',
                    name: 'tablet',
                    width: 768,
                    height: 1024,
                },
                {
                    label: 'Desktop',
                    name: 'desktop',
                    width: 1440,
                    height: 900,
                },
            ],
        },
    },
    // This config helps us configure global or default features that the other editors can inherit
    editor: defaultLexical,
    db: mongooseAdapter({
        url: process.env.DATABASE_URI,
    }),
    collections: [
        Pages,
        Posts,
        PostCategories,
        Media,
        Icons,
        SavedLayouts,
        Faqs,
        Navigation,
        Redirects,
        Users,
        ApiKeys,
    ],
    bin: [
        {
            scriptPath: path.resolve(dirname, 'scripts/seeds/index.ts'),
            key: 'seed',
        },
    ],
    cors: [getServerSideURL()].filter(Boolean),
    globals: [Options, Translations],
    plugins: [
        ...plugins,
        // storage-adapter-placeholder
    ],
    secret: process.env.PAYLOAD_SECRET,
    sharp,
    typescript: {
        outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
    jobs: {
        access: {
            run: ({ req }: { req: PayloadRequest }): boolean => {
                // Allow logged in users to execute this endpoint (default)
                if (req.user) return true;

                // If there is no logged in user, then check
                // for the Vercel Cron secret to be present as an
                // Authorization header:
                const authHeader = req.headers.get('authorization');
                return authHeader === `Bearer ${process.env.CRON_SECRET}`;
            },
        },
        tasks: [],
    },
    i18n: {
        supportedLanguages: { en, da },
        fallbackLanguage: defaultLocale,
    },
    localization: {
        defaultLocale,
        locales: [...locales],
    },
    email: resendAdapter({
        defaultFromAddress: 'no-reply@oaklab.cloud',
        defaultFromName: 'Oaklab Reset Password',
        apiKey: process.env.RESEND_API_KEY || '',
    }),
});
