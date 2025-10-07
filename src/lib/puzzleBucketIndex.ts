// Pattern bucket indexing for O(1) neighbor lookups
// Implements the algorithm from the comprehensive plan

export interface BucketIndex {
  delta1Buckets: Map<string, number[]>;
  delta2Buckets: Map<string, number[]>;
  wordToId: Map<string, number>;
  idToWord: Map<number, string>;
}

/**
 * Create mask with wildcard at position i
 * Example: "CATS", i=1 -> "C*TS"
 */
const mask1 = (word: string, i: number): string => {
  return word.substring(0, i) + '*' + word.substring(i + 1);
};

/**
 * Create mask with wildcards at positions i and j
 * Example: "CATS", i=1, j=3 -> "C*T*"
 */
const mask2 = (word: string, i: number, j: number): string => {
  let result = '';
  for (let k = 0; k < word.length; k++) {
    if (k === i || k === j) {
      result += '*';
    } else {
      result += word[k];
    }
  }
  return result;
};

/**
 * Build pattern buckets for fast neighbor lookup
 */
export const buildBucketIndex = (words: Set<string>): BucketIndex => {
  const wordArray = Array.from(words);
  const L = wordArray[0]?.length || 0;
  
  const wordToId = new Map<string, number>();
  const idToWord = new Map<number, string>();
  const delta1Buckets = new Map<string, number[]>();
  const delta2Buckets = new Map<string, number[]>();
  
  // Build word-to-id mappings
  wordArray.forEach((word, id) => {
    wordToId.set(word, id);
    idToWord.set(id, word);
  });
  
  // Build Δ=1 buckets
  for (let id = 0; id < wordArray.length; id++) {
    const word = wordArray[id];
    for (let i = 0; i < L; i++) {
      const key = mask1(word, i);
      if (!delta1Buckets.has(key)) {
        delta1Buckets.set(key, []);
      }
      delta1Buckets.get(key)!.push(id);
    }
  }
  
  // Build Δ=2 buckets
  for (let id = 0; id < wordArray.length; id++) {
    const word = wordArray[id];
    for (let i = 0; i < L; i++) {
      for (let j = i + 1; j < L; j++) {
        const key = mask2(word, i, j);
        if (!delta2Buckets.has(key)) {
          delta2Buckets.set(key, []);
        }
        delta2Buckets.get(key)!.push(id);
      }
    }
  }
  
  return { delta1Buckets, delta2Buckets, wordToId, idToWord };
};

/**
 * Get neighbors with exactly 1 letter difference
 */
export const neighborsDelta1 = (
  word: string,
  index: BucketIndex
): number[] => {
  const wordId = index.wordToId.get(word);
  if (wordId === undefined) return [];
  
  const out = new Set<number>();
  const L = word.length;
  
  for (let i = 0; i < L; i++) {
    const key = mask1(word, i);
    const bucket = index.delta1Buckets.get(key) || [];
    for (const id of bucket) {
      if (id !== wordId) {
        out.add(id);
      }
    }
  }
  
  return Array.from(out);
};

/**
 * Get neighbors with 1 or 2 letter differences
 */
export const neighborsDelta2 = (
  word: string,
  index: BucketIndex
): number[] => {
  const wordId = index.wordToId.get(word);
  if (wordId === undefined) return [];
  
  const out = new Set<number>(neighborsDelta1(word, index));
  const L = word.length;
  
  for (let i = 0; i < L; i++) {
    for (let j = i + 1; j < L; j++) {
      const key = mask2(word, i, j);
      const bucket = index.delta2Buckets.get(key) || [];
      for (const id of bucket) {
        if (id !== wordId) {
          out.add(id);
        }
      }
    }
  }
  
  return Array.from(out);
};

// Cache bucket indices by word set size
const bucketCache = new Map<string, BucketIndex>();

export const getCachedBucketIndex = (words: Set<string>): BucketIndex => {
  const cacheKey = `bucket_${words.size}`;
  
  if (bucketCache.has(cacheKey)) {
    return bucketCache.get(cacheKey)!;
  }
  
  const index = buildBucketIndex(words);
  bucketCache.set(cacheKey, index);
  return index;
};
