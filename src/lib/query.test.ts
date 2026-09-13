import { describe, expect, it } from 'vitest';
import { deriveSearchQuery, dedupeCandidates } from './query';
import type { ZhihuSearchItem } from './types';

describe('deriveSearchQuery', () => {
  it('strips common hedging prefixes', () => {
    expect(deriveSearchQuery('我在纠结要不要辞职去创业')).toBe('辞职去创业');
    expect(deriveSearchQuery('要不要读研？')).toBe('读研');
    expect(deriveSearchQuery('该不该跟家里借钱')).toBe('跟家里借钱');
  });

  it('falls back to the trimmed original when no prefix matches', () => {
    expect(deriveSearchQuery('  35岁转行做程序员  ')).toBe('35岁转行做程序员');
  });
});

function makeItem(overrides: Partial<ZhihuSearchItem>): ZhihuSearchItem {
  return {
    Title: 'title',
    ContentType: 'answer',
    ContentID: 'id-1',
    ContentText: 'this is a long enough content snippet for the test',
    Url: 'https://www.zhihu.com/answer/1',
    CommentCount: 0,
    VoteUpCount: 10,
    AuthorName: 'author-a',
    AuthorAvatar: '',
    AuthorBadge: '',
    AuthorBadgeText: '',
    EditTime: 0,
    AuthorityLevel: '1',
    ...overrides,
  };
}

describe('dedupeCandidates', () => {
  it('keeps the higher-voted item per author', () => {
    const items = [
      makeItem({ ContentID: '1', AuthorName: 'a', VoteUpCount: 5 }),
      makeItem({ ContentID: '2', AuthorName: 'a', VoteUpCount: 50 }),
      makeItem({ ContentID: '3', AuthorName: 'b', VoteUpCount: 20 }),
    ];

    const result = dedupeCandidates(items);
    expect(result).toHaveLength(2);
    expect(result[0].contentId).toBe('2');
    expect(result[1].contentId).toBe('3');
  });

  it('filters out items with too-short content', () => {
    const items = [makeItem({ ContentText: 'short' })];
    expect(dedupeCandidates(items)).toHaveLength(0);
  });
});
