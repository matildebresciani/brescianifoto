import { describe, expect, it } from 'vitest';
import { sectionRowLabel } from './row-labels';

describe('gallery section labels', () => {
    it('shows the current photo title and selection count', () => {
        expect(sectionRowLabel({ blockType: 'photos', title: ' The ceremony ', photos: ['one'] })).toBe(
            'The ceremony · 1 photo',
        );
        expect(sectionRowLabel({ blockType: 'photos', title: '', photos: ['one', 'two'] })).toBe(
            'Photo section · 2 photos',
        );
        expect(sectionRowLabel({ blockType: 'photos' })).toBe('Photo section · 0 photos');
    });
    it('uses authored block names or readable excerpts across rich text formatting', () => {
        const content = {
            root: {
                type: 'root',
                children: [
                    { children: [{ text: 'A ' }, { text: 'quiet' }, { text: ' moment.' }] },
                    { children: [{ text: 'After the ceremony.' }] },
                ],
            },
        };
        expect(sectionRowLabel({ blockType: 'text', content })).toBe('Text · A quiet moment. After the ceremony.');
        expect(sectionRowLabel({ blockType: 'text', blockName: ' Introduction ', content })).toBe('Introduction');
        expect(sectionRowLabel({ blockType: 'text', content: { text: 'a'.repeat(100) } })).toBe(
            `Text · ${'a'.repeat(80)}…`,
        );
    });
    it('handles empty and malformed content without exposing editor markup', () => {
        expect(sectionRowLabel({ blockType: 'text', content: { root: { children: [] } } })).toBe('Text section');
        expect(sectionRowLabel({ blockType: 'text', content: '<p>legacy</p>' })).toBe('Text section');
        expect(sectionRowLabel(null)).toBe('Section');
    });
});
