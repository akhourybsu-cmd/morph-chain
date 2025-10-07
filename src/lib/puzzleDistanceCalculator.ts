// Distance calculation and path counting via reverse BFS + DP
// Implements the comprehensive algorithm for puzzle difficulty rating

import { BucketIndex, neighborsDelta1, neighborsDelta2 } from './puzzleBucketIndex';

interface PathStats {
  minDistance: number;
  pathCount: number;
  avgBranching: number;
}

/**
 * Reverse BFS from goal to compute distance array
 */
export const reverseBfs = (
  goalId: number,
  wordCount: number,
  neighborsFn: (wordId: number, index: BucketIndex) => number[],
  index: BucketIndex
): Int16Array => {
  const INF = 0x7fff;
  const dist = new Int16Array(wordCount).fill(INF);
  const queue = [goalId];
  dist[goalId] = 0;
  
  while (queue.length > 0) {
    const u = queue.shift()!;
    const neighbors = neighborsFn(u, index);
    
    for (const v of neighbors) {
      if (dist[v] === INF) {
        dist[v] = dist[u] + 1;
        queue.push(v);
      }
    }
  }
  
  return dist;
};

/**
 * Calculate min distance and path count using DP over distance layers
 */
const statsFromDistArray = (
  startId: number,
  goalId: number,
  dist: Int16Array,
  wordCount: number,
  neighborsFn: (wordId: number, index: BucketIndex) => number[],
  index: BucketIndex
): PathStats => {
  const INF = 0x7fff;
  
  if (dist[startId] === INF) {
    return { minDistance: Infinity, pathCount: 0, avgBranching: 0 };
  }
  
  const minDistance = dist[startId];
  
  // Build layers by distance
  const byLayer: number[][] = [];
  for (let i = 0; i < wordCount; i++) {
    if (dist[i] !== INF) {
      const d = dist[i];
      if (!byLayer[d]) byLayer[d] = [];
      byLayer[d].push(i);
    }
  }
  
  // DP for path counting (use BigInt for large counts)
  const paths = new Array<bigint>(wordCount).fill(0n);
  paths[goalId] = 1n;
  
  // Work backwards from goal to start
  for (let d = 1; d <= minDistance; d++) {
    const layer = byLayer[d] || [];
    for (const u of layer) {
      let sum = 0n;
      const neighbors = neighborsFn(u, index);
      
      for (const v of neighbors) {
        if (dist[v] === dist[u] - 1) {
          sum += paths[v];
        }
      }
      
      paths[u] = sum;
    }
  }
  
  // Calculate average branching
  let totalBranching = 0;
  let nodeCount = 0;
  
  for (let d = 1; d <= minDistance; d++) {
    const layer = byLayer[d] || [];
    for (const u of layer) {
      const neighbors = neighborsFn(u, index);
      const validNext = neighbors.filter(v => dist[v] === dist[u] - 1).length;
      if (validNext > 0) {
        totalBranching += validNext;
        nodeCount++;
      }
    }
  }
  
  const avgBranching = nodeCount > 0 ? totalBranching / nodeCount : 0;
  
  return {
    minDistance,
    pathCount: Number(paths[startId] > BigInt(Number.MAX_SAFE_INTEGER) 
      ? Number.MAX_SAFE_INTEGER 
      : paths[startId]),
    avgBranching
  };
};

/**
 * Calculate stats for 4L (Δ=1 only)
 */
export const calculate4LStats = (
  start: string,
  goal: string,
  index: BucketIndex,
  distArray: Int16Array
): PathStats => {
  const startId = index.wordToId.get(start);
  const goalId = index.wordToId.get(goal);
  
  if (startId === undefined || goalId === undefined) {
    return { minDistance: Infinity, pathCount: 0, avgBranching: 0 };
  }
  
  return statsFromDistArray(
    startId,
    goalId,
    distArray,
    index.wordToId.size,
    (wordId) => neighborsDelta1(index.idToWord.get(wordId)!, index),
    index
  );
};

/**
 * Calculate stats for 5L (first move Δ≤2, then Δ=1)
 */
export const calculate5LStats = (
  start: string,
  goal: string,
  index: BucketIndex,
  distDelta1Array: Int16Array
): PathStats => {
  const startId = index.wordToId.get(start);
  const goalId = index.wordToId.get(goal);
  
  if (startId === undefined || goalId === undefined) {
    return { minDistance: Infinity, pathCount: 0, avgBranching: 0 };
  }
  
  const INF = 0x7fff;
  let bestDist = Infinity;
  let totalPaths = 0;
  
  // Get all Δ≤2 neighbors of start (possible first moves)
  const firstHopNeighbors = neighborsDelta2(start, index);
  
  // For each possible first hop, calculate distance via Δ=1 graph
  for (const neighborId of firstHopNeighbors) {
    const distToGoal = distDelta1Array[neighborId];
    
    if (distToGoal === INF) continue;
    
    const totalDist = 1 + distToGoal;
    
    if (totalDist < bestDist) {
      bestDist = totalDist;
      totalPaths = 0;
    }
    
    if (totalDist === bestDist) {
      // Count paths through this neighbor
      const neighborStats = statsFromDistArray(
        neighborId,
        goalId,
        distDelta1Array,
        index.wordToId.size,
        (wordId) => neighborsDelta1(index.idToWord.get(wordId)!, index),
        index
      );
      totalPaths += neighborStats.pathCount;
    }
  }
  
  // Calculate average branching (simplified for 5L)
  const avgBranching = firstHopNeighbors.length > 0 
    ? firstHopNeighbors.length / 2 
    : 0;
  
  return {
    minDistance: bestDist === Infinity ? Infinity : bestDist,
    pathCount: totalPaths,
    avgBranching
  };
};

/**
 * Calculate stats for 6L (all moves Δ≤2)
 */
export const calculate6LStats = (
  start: string,
  goal: string,
  index: BucketIndex,
  distArray: Int16Array
): PathStats => {
  const startId = index.wordToId.get(start);
  const goalId = index.wordToId.get(goal);
  
  if (startId === undefined || goalId === undefined) {
    return { minDistance: Infinity, pathCount: 0, avgBranching: 0 };
  }
  
  return statsFromDistArray(
    startId,
    goalId,
    distArray,
    index.wordToId.size,
    (wordId) => neighborsDelta2(index.idToWord.get(wordId)!, index),
    index
  );
};

/**
 * Pre-compute reverse BFS distance arrays for a goal
 * Returns both Δ=1 and Δ≤2 distance arrays
 */
export const precomputeDistanceArrays = (
  goal: string,
  index: BucketIndex
): { distDelta1: Int16Array; distDelta2: Int16Array } => {
  const goalId = index.wordToId.get(goal);
  
  if (goalId === undefined) {
    const empty = new Int16Array(index.wordToId.size).fill(0x7fff);
    return { distDelta1: empty, distDelta2: empty };
  }
  
  const distDelta1 = reverseBfs(
    goalId,
    index.wordToId.size,
    (wordId) => neighborsDelta1(index.idToWord.get(wordId)!, index),
    index
  );
  
  const distDelta2 = reverseBfs(
    goalId,
    index.wordToId.size,
    (wordId) => neighborsDelta2(index.idToWord.get(wordId)!, index),
    index
  );
  
  return { distDelta1, distDelta2 };
};
