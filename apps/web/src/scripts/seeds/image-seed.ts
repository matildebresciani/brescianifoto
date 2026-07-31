import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Payload } from 'payload';

export const seedMedia = async (payload: Payload) => {
    const imagePath = path.join(process.cwd(), 'public/images/__mocks__/placeholder.jpg');

    // Check if file exists
    if (!fs.existsSync(imagePath)) {
        payload.logger.error(`Image not found at ${imagePath}`);
        return null;
    }

    // Read the file
    const fileBuffer = fs.readFileSync(imagePath);
    const fileName = path.basename(imagePath);

    // Create media entry with file upload
    const media = await payload.create({
        collection: 'media',
        data: {
            alt: 'Placeholder Image',
        },
        file: {
            data: fileBuffer,
            mimetype: 'image/jpeg',
            name: fileName,
            size: fileBuffer.length,
        },
    });

    payload.logger.info(`✓ Seeded media: ${media.filename} (ID: ${media.id})`);
    return media.id;
};
