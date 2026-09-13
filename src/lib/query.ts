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

function extractBigrams(text: string): Set<string> {
  const clean = text.replace(/[？?。！!，,\s]/g, '');
  const bigrams = new Set<string>();
  for (let i = 0; i < clean.length - 1; i++) {
    bigrams.add(clean.slice(i, i + 2));
  }
  return bigrams;
}

/**
 * Zhihu's search is fuzzy/semantic and almost never returns zero results, even
 * for gibberish input — it'll happily match on theme alone (e.g. a string of
 * random rare characters pulls back articles about rare characters). Requiring
 * a literal 2-character overlap with the query is what actually distinguishes
 * "found someone relevant" from "found something that merely ranked."
 */
export function isRelevant(query: string, candidateText: string): boolean {
  const queryBigrams = extractBigrams(query);
  if (queryBigrams.size === 0) return true;
  const textBigrams = extractBigrams(candidateText);
  for (const bigram of queryBigrams) {
    if (textBigrams.has(bigram)) return true;
  }
  return false;
}

export function dedupeCandidates(items: ZhihuSearchItem[], query: string): Candidate[] {
  const byAuthor = new Map<string, ZhihuSearchItem>();

  for (const item of items) {
    const plainText = item.ContentText.replace(/<\/?em>/g, '');
    if (plainText.length < MIN_CONTENT_LENGTH) {
      continue;
    }
    if (!isRelevant(query, `${item.Title}${plainText}`)) {
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
