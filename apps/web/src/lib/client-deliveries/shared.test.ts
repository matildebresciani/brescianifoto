import { describe, expect, it } from 'vitest';
import { photoSetRevision } from './revision';
import {
    contrastRatio,
    resolveSectionTheme,
    sectionColorsSchema,
    sectionSchema,
    selectedPhotoIDs,
    themeDefaults,
    themeIssues,
    themeSchema,
    themeStyle,
} from './shared';
import { attachmentName, readUploadSession, signUploadSession } from './storage';

describe('client gallery theme and photo revisions', () => {
    it('resolves palette references against the current gallery and preserves legacy custom colors', () => {
        const colors = { backgroundSource: 'text', textSource: 'background', background: '#123456' };
        const section = resolveSectionTheme(themeDefaults, colors);
        expect(section.theme.background).toBe(themeDefaults.text);
        expect(section.theme.text).toBe(themeDefaults.background);
        expect(themeIssues(section.theme)).toEqual([]);
        const changed = resolveSectionTheme({ ...themeDefaults, text: '#222222' }, colors);
        expect(changed.theme.background).toBe('#222222');
        expect(resolveSectionTheme(themeDefaults, { background: '#123456' }).theme.background).toBe('#123456');
        expect(resolveSectionTheme(themeDefaults, { backgroundSource: 'inherit', background: '#123456' }).theme).toBe(
            themeDefaults,
        );
        expect(sectionColorsSchema.safeParse({ textSource: 'custom' }).success).toBe(false);
        expect(sectionColorsSchema.safeParse({ backgroundSource: 'url(evil)' }).success).toBe(false);
    });
    it('inherits blank section colors and scopes custom colors including metadata and portal tokens', () => {
        expect(resolveSectionTheme(themeDefaults, undefined)).toEqual({ theme: themeDefaults, hasCustomColors: false });
        expect(resolveSectionTheme(themeDefaults, { background: '', text: null }).theme).toBe(themeDefaults);
        const section = resolveSectionTheme(themeDefaults, { background: '#151611', text: '#FAFFEF' });
        expect(section.hasCustomColors).toBe(true);
        expect(themeIssues(section.theme)).toEqual([]);
        expect(themeStyle(section.theme)['--color-fg-subtle']).toBe('#FAFFEF');
        expect(themeStyle(section.theme)['--color-bg-base']).toBe('#151611');
        expect(themeIssues(resolveSectionTheme(themeDefaults, { background: themeDefaults.text }).theme)).not.toEqual(
            [],
        );
        expect(sectionColorsSchema.safeParse({ text: 'red;display:none' }).success).toBe(false);
    });
    it('retains section introduction and color overrides when normalizing stable anchors', () => {
        const introduction = { root: { type: 'root', children: [] } };
        const colors = { background: '#151611', text: '#FAFFEF' };
        expect(sectionSchema.parse({ blockType: 'photos', title: 'Ceremony', introduction, colors })).toMatchObject({
            introduction,
            colors,
        });
    });
    it('checks actual contrast on both backgrounds, including muted text', () => {
        expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21);
        expect(themeIssues(themeDefaults)).toEqual([]);
        expect(themeIssues({ ...themeDefaults, muted: themeDefaults.surface })).toHaveLength(2);
        expect(themeIssues({ ...themeDefaults, surface: themeDefaults.text })).toHaveLength(2);
    });
    it('rejects arbitrary CSS and applies gallery colors to portal tokens', () => {
        expect(themeSchema.safeParse({ ...themeDefaults, background: 'url(https://example.com)' }).success).toBe(false);
        expect(themeStyle(themeDefaults)['--fg-on-color']).toBe(themeDefaults.background);
    });
    it('selects only photo-section assets and deduplicates relationships', () => {
        expect(
            selectedPhotoIDs([
                { blockType: 'text', photos: ['secret'] },
                { blockType: 'photos', title: 'Ceremony', photos: ['b', { id: 'a' }, 'b'] },
                { blockType: 'photos', title: 'Reception', photos: [{ id: 'b' }] },
            ]),
        ).toEqual(['a', 'b']);
    });
    it('changes the archive revision for additions, removals and replacement bytes, not reordering', () => {
        const first = { id: 'first', checksum: 'one' };
        const second = { id: 'second', checksum: 'two' };
        const current = photoSetRevision([first, second]);
        expect(photoSetRevision([second, first])).toBe(current);
        expect(photoSetRevision([first])).not.toBe(current);
        expect(photoSetRevision([first, { ...second, checksum: 'replacement' }])).not.toBe(current);
        expect(photoSetRevision([first, second, { id: 'third', checksum: 'three' }])).not.toBe(current);
    });
});

describe('direct storage protocol', () => {
    const session = {
        key: 'client-deliveries/random/original.jpg',
        uploadId: 'multipart-id',
        galleryId: 'gallery-id',
        originalFilename: 'Wedding.jpg',
        byteSize: 12345,
        kind: 'photo',
        revision: 'revision',
        expiresAt: Date.now() + 60000,
        userId: 'admin',
    } satisfies Parameters<typeof signUploadSession>[0];
    it('rejects forged, expired and cross-user upload sessions', () => {
        const token = signUploadSession(session, 'test-secret');
        expect(readUploadSession(token, 'test-secret', 'admin')).toEqual(session);
        expect(readUploadSession(`${token}forged`, 'test-secret', 'admin')).toBeUndefined();
        expect(readUploadSession(token, 'test-secret', 'another-user')).toBeUndefined();
        expect(readUploadSession(token, 'wrong-secret', 'admin')).toBeUndefined();
        expect(
            readUploadSession(signUploadSession({ ...session, expiresAt: 0 }, 'test-secret'), 'test-secret', 'admin'),
        ).toBeUndefined();
    });
    it('preserves Unicode names while preventing attachment-header injection', () => {
        const header = attachmentName('Élodie & Alex\r\n/photo".jpg');
        expect(header).not.toMatch(/[\r\n]/);
        expect(header).toContain("filename*=UTF-8''%C3%89lodie");
        expect(header).toContain('attachment;');
    });
});
