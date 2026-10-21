import { createHash } from 'node:crypto';
import { err, ok, ResultAsync } from 'neverthrow';
import sharp from 'sharp';

/** Read metadata and derive a thumbnail without ever writing back to the original buffer. */
export async function inspectOriginalJPEG(bytes: Buffer) {
    const metadata = await ResultAsync.fromPromise(
        sharp(bytes, { limitInputPixels: 100_000_000 }).metadata(),
        () => 'This file is not a readable JPEG or exceeds 100 megapixels.',
    );
    if (metadata.isErr()) return err(metadata.error);
    if (metadata.value.format !== 'jpeg' || !metadata.value.width || !metadata.value.height) {
        return err('This file is not a valid JPEG.');
    }
    const thumbnail = await ResultAsync.fromPromise(
        sharp(bytes, { limitInputPixels: 100_000_000 })
            .rotate()
            .resize({ width: 300, height: 300, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer(),
        () => 'The JPEG could not be decoded. Export it again and retry.',
    );
    if (thumbnail.isErr()) return err(thumbnail.error);
    const isRotated = metadata.value.orientation && metadata.value.orientation >= 5;
    return ok({
        checksum: createHash('sha256').update(bytes).digest('hex'),
        width: isRotated ? metadata.value.height : metadata.value.width,
        height: isRotated ? metadata.value.width : metadata.value.height,
        thumbnail: thumbnail.value,
    });
}
