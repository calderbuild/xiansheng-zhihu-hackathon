function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/**
 * Deterministic per-candidate "voiceprint" bar heights (0-1), seeded by
 * contentId so the same real person always renders the same shape.
 */
export function voiceprintHeights(seed: string, bars: number): number[] {
  let state = hashSeed(seed) || 1;
  const heights: number[] = [];
  for (let i = 0; i < bars; i++) {
    state = (state * 1103515245 + 12345) >>> 0;
    heights.push(0.25 + (state % 1000) / 1000 / 1.3);
  }
  return heights;
}
