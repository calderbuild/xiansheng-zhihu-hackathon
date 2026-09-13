export interface HighlightSegment {
  text: string;
  highlighted: boolean;
}

/**
 * Parses the <em>...</em> highlight markers Zhihu's search API embeds in
 * ContentText into plain segments, so callers never need
 * dangerouslySetInnerHTML.
 */
export function parseHighlightSegments(contentText: string): HighlightSegment[] {
  const segments: HighlightSegment[] = [];
  const pattern = /<em>(.*?)<\/em>/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(contentText)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: contentText.slice(lastIndex, match.index), highlighted: false });
    }
    segments.push({ text: match[1], highlighted: true });
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < contentText.length) {
    segments.push({ text: contentText.slice(lastIndex), highlighted: false });
  }

  return segments;
}
