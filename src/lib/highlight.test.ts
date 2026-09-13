import { describe, expect, it } from 'vitest';
import { parseHighlightSegments } from './highlight';

describe('parseHighlightSegments', () => {
  it('splits highlighted and plain segments', () => {
    const result = parseHighlightSegments('我<em>辞职</em>去创业了，过程很<em>艰难</em>');
    expect(result).toEqual([
      { text: '我', highlighted: false },
      { text: '辞职', highlighted: true },
      { text: '去创业了，过程很', highlighted: false },
      { text: '艰难', highlighted: true },
    ]);
  });

  it('returns a single plain segment when there is no highlight', () => {
    expect(parseHighlightSegments('plain text')).toEqual([{ text: 'plain text', highlighted: false }]);
  });
});
