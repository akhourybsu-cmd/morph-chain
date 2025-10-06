// Morph Prism puzzle generator and validation
import { COLOR_GRID, ColorState, colorsEqual } from './prismColorGrid';

export interface PrismPuzzle {
  id: string;
  dateLocal: string;
  puzzleNumber: number;
  start: ColorState;
  goal: ColorState;
  minDistance: number;
  cap: number;
  hints: number;
}

// BFS to find shortest path distance
export function calculateMinDistance(
  start: ColorState,
  goal: ColorState
): { minDistance: number; pathCount: number } {
  if (colorsEqual(start, goal)) {
    return { minDistance: 0, pathCount: 1 };
  }
  
  const queue: { color: ColorState; distance: number }[] = [
    { color: start, distance: 0 }
  ];
  
  const visited = new Set<string>();
  const colorKey = (c: ColorState) => `${c.H},${c.S},${c.L}`;
  visited.add(colorKey(start));
  
  const distanceMap = new Map<number, number>(); // distance -> count
  let minDistance = Infinity;
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    
    // Try all possible moves
    const neighbors: ColorState[] = [];
    
    // Hue changes
    const hIndex = COLOR_GRID.H.indexOf(current.color.H);
    const nextH = COLOR_GRID.H[(hIndex + 1) % COLOR_GRID.H.length];
    const prevH = COLOR_GRID.H[(hIndex - 1 + COLOR_GRID.H.length) % COLOR_GRID.H.length];
    neighbors.push({ ...current.color, H: nextH });
    neighbors.push({ ...current.color, H: prevH });
    
    // Saturation changes
    const sIndex = (COLOR_GRID.S as readonly number[]).indexOf(current.color.S);
    if (sIndex < COLOR_GRID.S.length - 1) {
      neighbors.push({ ...current.color, S: COLOR_GRID.S[sIndex + 1] });
    }
    if (sIndex > 0) {
      neighbors.push({ ...current.color, S: COLOR_GRID.S[sIndex - 1] });
    }
    
    // Lightness changes
    const lIndex = (COLOR_GRID.L as readonly number[]).indexOf(current.color.L);
    if (lIndex < COLOR_GRID.L.length - 1) {
      neighbors.push({ ...current.color, L: COLOR_GRID.L[lIndex + 1] });
    }
    if (lIndex > 0) {
      neighbors.push({ ...current.color, L: COLOR_GRID.L[lIndex - 1] });
    }
    
    for (const neighbor of neighbors) {
      const key = colorKey(neighbor);
      
      if (visited.has(key)) continue;
      
      const newDistance = current.distance + 1;
      
      if (colorsEqual(neighbor, goal)) {
        minDistance = Math.min(minDistance, newDistance);
        distanceMap.set(newDistance, (distanceMap.get(newDistance) || 0) + 1);
        continue;
      }
      
      // Don't explore beyond minDistance if we found it
      if (newDistance < minDistance) {
        visited.add(key);
        queue.push({ color: neighbor, distance: newDistance });
      }
    }
  }
  
  const pathCount = distanceMap.get(minDistance) || 0;
  return { minDistance, pathCount };
}

// Generate a random valid puzzle
export function generatePuzzle(dateString: string, puzzleNumber: number): PrismPuzzle | null {
  const maxAttempts = 100;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Random start and goal
    const start: ColorState = {
      H: COLOR_GRID.H[Math.floor(Math.random() * COLOR_GRID.H.length)],
      S: COLOR_GRID.S[Math.floor(Math.random() * COLOR_GRID.S.length)],
      L: COLOR_GRID.L[Math.floor(Math.random() * COLOR_GRID.L.length)],
    };
    
    const goal: ColorState = {
      H: COLOR_GRID.H[Math.floor(Math.random() * COLOR_GRID.H.length)],
      S: COLOR_GRID.S[Math.floor(Math.random() * COLOR_GRID.S.length)],
      L: COLOR_GRID.L[Math.floor(Math.random() * COLOR_GRID.L.length)],
    };
    
    if (colorsEqual(start, goal)) continue;
    
    const { minDistance, pathCount } = calculateMinDistance(start, goal);
    
    // Gates: minDistance ∈ [4..8] and pathCount ≥ 12
    if (minDistance >= 4 && minDistance <= 8 && pathCount >= 12) {
      // Cap formula: clamp(minDistance + 4, 8..14)
      const cap = Math.max(8, Math.min(14, minDistance + 4));
      
      // Hints: Easy 2, Standard 1, Hard 1
      const hints = minDistance <= 5 ? 2 : 1;
      
      return {
        id: `prism-${dateString}`,
        dateLocal: dateString,
        puzzleNumber,
        start,
        goal,
        minDistance,
        cap,
        hints,
      };
    }
  }
  
  return null;
}

// Get today's puzzle (simplified - in production this would be from backend)
export function getTodaysPuzzle(): PrismPuzzle {
  const today = new Date();
  const dateString = today.toISOString().split('T')[0];
  
  // Deterministic puzzle based on date
  const seed = dateString.split('-').reduce((acc, val) => acc + parseInt(val), 0);
  const puzzleNumber = Math.floor((today.getTime() - new Date('2025-01-01').getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // Hardcoded example puzzle for now
  return {
    id: `prism-${dateString}`,
    dateLocal: dateString,
    puzzleNumber,
    start: { H: 210, S: 55, L: 60 },
    goal: { H: 30, S: 40, L: 70 },
    minDistance: 6,
    cap: 10,
    hints: 1,
  };
}
