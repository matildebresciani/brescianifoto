import type { SanitizedConfig } from 'payload';
import { getPayload } from 'payload';
import { seedMedia } from './image-seed';
import { getMainMenuSeed } from './main-menu';
import { getPage1Seed } from './page-1';
import { getPage2Seed } from './page-2';
import { getPost1Seed } from './post-1';
import { getPost2Seed } from './post-2';

export const script = async (config: SanitizedConfig) => {
    try {
        const payload = await getPayload({ config });

        payload.logger.info('— Starter seeding via payload bin script...');

        // Seed media
        const mediaId = await seedMedia(payload);

        const page1 = await payload.create({
            collection: 'pages',
            data: getPage1Seed(mediaId),
            draft: false,
        });

        const page2 = await payload.create({
            collection: 'pages',
            data: getPage2Seed(mediaId),
            draft: false,
        });

        const post1 = await payload.create({
            collection: 'posts',
            data: getPost1Seed(mediaId),
            draft: false,
        });

        const post2 = await payload.create({
            collection: 'posts',
            data: getPost2Seed(mediaId),
            draft: false,
        });

        await payload.create({
            collection: 'navigation',
            data: getMainMenuSeed({
                page1Id: page1.id,
                page2Id: page2.id,
                post1Id: post1.id,
                post2Id: post2.id,
            }),
            draft: false,
        });

        payload.logger.info('Successfully seeded!');
        process.exit(0);
    } catch (error) {
        console.error('Fejl under seeding:', error);
        process.exit(1);
    }
};
