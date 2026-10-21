import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { inspectOriginalJPEG } from './photo';

describe('original JPEG preservation', () => {
    it('retains source bytes, EXIF, XMP and ICC while deriving a rotated WebP thumbnail', async () => {
        const source = await sharp({ create: { width: 800, height: 600, channels: 3, background: '#bbaabb' } })
            .jpeg()
            .withMetadata({ orientation: 6 })
            .withExif({ IFD0: { Artist: 'QA photographer', Copyright: 'QA copyright' } })
            .withIccProfile('srgb')
            .withXmp(
                '<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description xmlns:dc="http://purl.org/dc/elements/1.1/" dc:creator="QA photographer"/></rdf:RDF></x:xmpmeta>',
            )
            .toBuffer();
        const original = Buffer.from(source);
        const result = await inspectOriginalJPEG(source);
        expect(result.isOk()).toBe(true);
        if (result.isErr()) return;
        expect(source.equals(original)).toBe(true);
        expect(result.value.checksum).toBe(createHash('sha256').update(original).digest('hex'));
        expect(result.value.width).toBe(600);
        expect(result.value.height).toBe(800);
        const metadata = await sharp(source).metadata();
        expect(metadata.exif?.length).toBeGreaterThan(0);
        expect(metadata.icc?.length).toBeGreaterThan(0);
        expect(metadata.xmp?.length).toBeGreaterThan(0);
        expect((await sharp(result.value.thumbnail).metadata()).format).toBe('webp');
        expect((await sharp(result.value.thumbnail).metadata()).height).toBe(300);
    });
    it('rejects a renamed PNG and corrupted bytes', async () => {
        const png = await sharp({ create: { width: 10, height: 10, channels: 3, background: '#000000' } })
            .png()
            .toBuffer();
        expect((await inspectOriginalJPEG(png)).isErr()).toBe(true);
        expect((await inspectOriginalJPEG(Buffer.from('not an image'))).isErr()).toBe(true);
    });
});
