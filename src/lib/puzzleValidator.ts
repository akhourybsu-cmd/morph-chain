// Puzzle validation to ensure solvability with Modern English word list

// Cache word graphs to avoid rebuilding them repeatedly
const graphCache = new Map<string, Map<string, Set<string>>>();

/**
 * Get a cache key for a word set
 */
const getCacheKey = (words: Set<string>): string => {
  // Use size as a simple cache key since we have 3 distinct word sets (4L, 5L, 6L)
  return `graph_${words.size}`;
};

/**
 * Build a graph of one-letter connections between words (cached)
 */
export const buildWordGraph = (words: Set<string>): Map<string, Set<string>> => {
  const cacheKey = getCacheKey(words);
  
  // Return cached graph if available
  if (graphCache.has(cacheKey)) {
    return graphCache.get(cacheKey)!;
  }
  
  const graph = new Map<string, Set<string>>();
  const wordArray = Array.from(words);
  
  for (const word of wordArray) {
    graph.set(word, new Set());
  }
  
  for (let i = 0; i < wordArray.length; i++) {
    for (let j = i + 1; j < wordArray.length; j++) {
      const word1 = wordArray[i];
      const word2 = wordArray[j];
      
      if (isOneLetterDiff(word1, word2)) {
        graph.get(word1)!.add(word2);
        graph.get(word2)!.add(word1);
      }
    }
  }
  
  // Cache the result
  graphCache.set(cacheKey, graph);
  return graph;
};

const isOneLetterDiff = (word1: string, word2: string): boolean => {
  if (word1.length !== word2.length) return false;
  let differences = 0;
  for (let i = 0; i < word1.length; i++) {
    if (word1[i] !== word2[i]) differences++;
  }
  return differences === 1;
};

/**
 * BFS to find shortest path between two words
 */
export const findShortestPath = (
  start: string,
  goal: string,
  words: Set<string>
): string[] | null => {
  if (!words.has(start) || !words.has(goal)) {
    return null;
  }
  
  if (start === goal) {
    return [start];
  }
  
  const graph = buildWordGraph(words);
  const queue: Array<{ word: string; path: string[] }> = [{ word: start, path: [start] }];
  const visited = new Set<string>([start]);
  
  while (queue.length > 0) {
    const { word, path } = queue.shift()!;
    const neighbors = graph.get(word) || new Set();
    
    for (const neighbor of neighbors) {
      if (neighbor === goal) {
        return [...path, neighbor];
      }
      
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({ word: neighbor, path: [...path, neighbor] });
      }
    }
  }
  
  return null; // No path found
};

/**
 * Validate that a puzzle is solvable
 */
export const isPuzzleSolvable = (
  start: string,
  goal: string,
  words: Set<string>
): boolean => {
  const path = findShortestPath(start, goal, words);
  return path !== null && path.length >= 2;
};

/**
 * Calculate the minimum distance (shortest path length - 1)
 */
export const calculateMinDistance = (
  start: string,
  goal: string,
  words: Set<string>
): number => {
  const path = findShortestPath(start, goal, words);
  if (!path) return -1;
  return path.length - 1; // Number of moves, not number of words
};

/**
 * Get solution path (for debugging/testing)
 */
export const getSolutionPath = (
  start: string,
  goal: string,
  words: Set<string>
): string[] | null => {
  return findShortestPath(start, goal, words);
};

/**
 * Find ALL shortest paths between two words (for robustness checks)
 */
export const findAllShortestPaths = (
  start: string,
  goal: string,
  words: Set<string>
): string[][] => {
  if (!words.has(start) || !words.has(goal)) {
    return [];
  }
  
  if (start === goal) {
    return [[start]];
  }
  
  const graph = buildWordGraph(words);
  const queue: Array<{ word: string; path: string[] }> = [{ word: start, path: [start] }];
  const visited = new Map<string, number>(); // word -> shortest distance to it
  visited.set(start, 0);
  
  const allPaths: string[][] = [];
  let shortestLength = Infinity;
  
  while (queue.length > 0) {
    const { word, path } = queue.shift()!;
    
    // Skip if we've already found shorter paths
    if (path.length > shortestLength) {
      continue;
    }
    
    const neighbors = graph.get(word) || new Set();
    
    for (const neighbor of neighbors) {
      const newPath = [...path, neighbor];
      const newDistance = newPath.length - 1;
      
      if (neighbor === goal) {
        if (newPath.length < shortestLength) {
          // Found shorter path, clear previous paths
          allPaths.length = 0;
          allPaths.push(newPath);
          shortestLength = newPath.length;
        } else if (newPath.length === shortestLength) {
          // Found another path of same length
          allPaths.push(newPath);
        }
        continue;
      }
      
      // Only continue if we haven't visited this word, or we're visiting via equally short path
      if (!visited.has(neighbor) || visited.get(neighbor)! >= newDistance) {
        visited.set(neighbor, newDistance);
        queue.push({ word: neighbor, path: newPath });
      }
    }
  }
  
  return allPaths;
};

/**
 * Calculate average branching factor along shortest paths
 */
export const calculateAverageBranching = (
  start: string,
  goal: string,
  words: Set<string>
): number => {
  const paths = findAllShortestPaths(start, goal, words);
  if (paths.length === 0) return 0;
  
  const graph = buildWordGraph(words);
  
  // Calculate branching at each position along paths
  const pathLength = paths[0].length;
  let totalBranching = 0;
  let positions = 0;
  
  for (let i = 0; i < pathLength - 1; i++) {
    const wordsAtPosition = new Set(paths.map(p => p[i]));
    
    for (const word of wordsAtPosition) {
      const neighbors = graph.get(word) || new Set();
      // Count valid next steps (neighbors that appear in next position of any path)
      const validNextSteps = paths
        .filter(p => p[i] === word)
        .map(p => p[i + 1]);
      const uniqueNextSteps = new Set(validNextSteps);
      
      totalBranching += uniqueNextSteps.size;
      positions++;
    }
  }
  
  return positions > 0 ? totalBranching / positions : 0;
};
