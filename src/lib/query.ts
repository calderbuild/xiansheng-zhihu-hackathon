import type { Candidate, ZhihuSearchItem } from './types';

const PREFIX_PATTERNS = [
  /^我(现在|最近|一直)?在?纠结/,
  /^我(现在|最近)?想知道/,
  /^我(现在|最近)?在?考虑/,
  /^该不该/,
  /^要不要/,
  /^值不值得/,
  /^到底(要|该)不(要|该)/,
];

/**
 * Strips first-person hedging language ("我在纠结要不要...") down to the core
 * action phrase, so the Zhihu search engine sees a plain query instead of a
 * conversational sentence.
 */
export function deriveSearchQuery(situation: string): string {
  let text = situation.trim();
  for (const pattern of PREFIX_PATTERNS) {
    text = text.replace(pattern, '');
  }
  text = text.replace(/[？?。！!，,]+$/g, '').trim();
  return text || situation.trim();
}

const MIN_CONTENT_LENGTH = 20;

export function dedupeCandidates(items: ZhihuSearchItem[]): Candidate[] {
  const byAuthor = new Map<string, ZhihuSearchItem>();

  for (const item of items) {
    if (item.ContentText.replace(/<\/?em>/g, '').length < MIN_CONTENT_LENGTH) {
      continue;
    }

    const existing = byAuthor.get(item.AuthorName);
    if (!existing || item.VoteUpCount > existing.VoteUpCount) {
      byAuthor.set(item.AuthorName, item);
    }
  }

  return Array.from(byAuthor.values())
    .sort((a, b) => b.VoteUpCount - a.VoteUpCount)
    .map((item) => ({
      contentId: item.ContentID,
      title: item.Title,
      contentText: item.ContentText,
      url: item.Url,
      authorName: item.AuthorName,
      authorAvatar: item.AuthorAvatar,
      authorBadgeText: item.AuthorBadgeText,
      voteUpCount: item.VoteUpCount,
      commentCount: item.CommentCount,
    }));
}
