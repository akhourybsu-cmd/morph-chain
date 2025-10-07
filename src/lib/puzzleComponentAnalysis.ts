// Component labeling for instant O(1) solvability checks
// Uses Union-Find structure for connected component analysis

import { BucketIndex, neighborsDelta1, neighborsDelta2 } from './puzzleBucketIndex';

/**
 * Label connected components using BFS
 */
export const labelComponents = (
  wordCount: number,
  neighborsFn: (wordId: number, index: BucketIndex) => number[],
  index: BucketIndex
): Int32Array => {
  const comp = new Int32Array(wordCount).fill(-1);
  let cid = 0;
  
  for (let s = 0; s < wordCount; s++) {
    if (comp[s] < 0) {
      const queue = [s];
      comp[s] = cid;
      
      while (queue.length > 0) {
        const u = queue.shift()!;
        const neighbors = neighborsFn(u, index);
        
        for (const v of neighbors) {
          if (comp[v] < 0) {
            comp[v] = cid;
            queue.push(v);
          }
        }
      }
      
      cid++;
    }
  }
  
  return comp;
};

/**
 * Check if two words are in the same component (O(1) solvability check)
 */
export const inSameComponent = (
  word1: string,
  word2: string,
  components: Int32Array,
  index: BucketIndex
): boolean => {
  const id1 = index.wordToId.get(word1);
  const id2 = index.wordToId.get(word2);
  
  if (id1 === undefined || id2 === undefined) return false;
  
  return components[id1] === components[id2];
};

/**
 * For 5L: Check if any Δ≤2 neighbor of start shares Δ=1 component with goal
 */
export const is5LSolvable = (
  start: string,
  goal: string,
  delta1Components: Int32Array,
  index: BucketIndex
): boolean => {
  const goalId = index.wordToId.get(goal);
  if (goalId === undefined) return false;
  
  const goalComp = delta1Components[goalId];
  
  // Get all Δ≤2 neighbors of start
  const startNeighbors = neighborsDelta2(start, index);
  
  // Check if any neighbor shares component with goal
  for (const neighborId of startNeighbors) {
    if (delta1Components[neighborId] === goalComp) {
      return true;
    }
  }
  
  return false;
};

// Component cache
interface ComponentCache {
  delta1Components: Int32Array;
  delta2Components: Int32Array;
}

const componentCache = new Map<string, ComponentCache>();

export const getCachedComponents = (
  words: Set<string>,
  index: BucketIndex
): ComponentCache => {
  const cacheKey = `comp_${words.size}`;
  
  if (componentCache.has(cacheKey)) {
    return componentCache.get(cacheKey)!;
  }
  
  const wordCount = words.size;
  
  // Label Δ=1 components (for 4L and 5L)
  const delta1Components = labelComponents(
    wordCount,
    (wordId) => neighborsDelta1(index.idToWord.get(wordId)!, index),
    index
  );
  
  // Label Δ≤2 components (for 6L)
  const delta2Components = labelComponents(
    wordCount,
    (wordId) => neighborsDelta2(index.idToWord.get(wordId)!, index),
    index
  );
  
  const cache = { delta1Components, delta2Components };
  componentCache.set(cacheKey, cache);
  return cache;
};
