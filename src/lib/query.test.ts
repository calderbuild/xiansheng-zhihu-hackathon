import { describe, expect, it } from 'vitest';
import { deriveSearchQuery, dedupeCandidates, isRelevant } from './query';
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

describe('isRelevant', () => {
  it('matches when query and content share a real word', () => {
    expect(isRelevant('放弃保研，直接工作', '从放弃985计科保研到秋招进大厂')).toBe(true);
  });

  it('rejects content that shares no substring with the query', () => {
    expect(isRelevant('喵啦嘞嗧嗑喃喱咀嗄呤图相栎蟏镒蛜螷', '粤语为什么有自己的文字')).toBe(false);
  });

  it('treats an empty query as unrestricted', () => {
    expect(isRelevant('', '随便什么内容')).toBe(true);
  });
});

describe('dedupeCandidates', () => {
  it('keeps the higher-voted item per author', () => {
    const items = [
      makeItem({ ContentID: '1', AuthorName: 'a', VoteUpCount: 5 }),
      makeItem({ ContentID: '2', AuthorName: 'a', VoteUpCount: 50 }),
      makeItem({ ContentID: '3', AuthorName: 'b', VoteUpCount: 20 }),
    ];

    const result = dedupeCandidates(items, 'long enough');
    expect(result).toHaveLength(2);
    expect(result[0].contentId).toBe('2');
    expect(result[1].contentId).toBe('3');
  });

  it('filters out items with too-short content', () => {
    const items = [makeItem({ ContentText: 'short' })];
    expect(dedupeCandidates(items, 'short')).toHaveLength(0);
  });

  it('filters out items that pass the length check but share nothing with the query', () => {
    const items = [makeItem({ ContentText: '这是一段足够长的完全无关内容用来测试过滤逻辑' })];
    expect(dedupeCandidates(items, '放弃保研直接工作')).toHaveLength(0);
  });

  it('keeps items whose title or content overlaps with the query', () => {
    const items = [
      makeItem({
        Title: '放弃保研选择直接工作，是勇敢还是短视？',
        ContentText: '这是一段足够长的相关内容用来测试过滤逻辑是否通过',
      }),
    ];
    expect(dedupeCandidates(items, '放弃保研直接工作')).toHaveLength(1);
  });
});
