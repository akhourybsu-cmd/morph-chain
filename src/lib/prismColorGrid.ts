// Morph Prism color grid and utilities
// HSL discrete grid: H (24 steps), S (6 steps), L (6 steps)

export const COLOR_GRID = {
  H: Array.from({ length: 24 }, (_, i) => i * 15), // 0, 15, 30, ..., 345
  S: [10, 25, 40, 55, 70, 85],
  L: [20, 30, 40, 60, 70, 80],
} as const;

export type Channel = 'H' | 'S' | 'L';

export interface ColorState {
  H: number;
  S: number;
  L: number;
}

export interface Move {
  channel: Channel;
  direction: '+' | '-';
  from: ColorState;
  to: ColorState;
}

// Convert HSL to CSS string
export function hslToString(color: ColorState): string {
  return `hsl(${color.H}, ${color.S}%, ${color.L}%)`;
}

// Get the index of a value in its channel array
function getChannelIndex(channel: Channel, value: number): number {
  const array = COLOR_GRID[channel] as readonly number[];
  return array.indexOf(value);
}

// Check if a color is valid on the grid
export function isValidColor(color: ColorState): boolean {
  return (
    (COLOR_GRID.H as readonly number[]).includes(color.H) &&
    (COLOR_GRID.S as readonly number[]).includes(color.S) &&
    (COLOR_GRID.L as readonly number[]).includes(color.L)
  );
}

// Get the next valid value for a channel step
export function getNextChannelValue(
  channel: Channel,
  currentValue: number,
  direction: '+' | '-'
): number | null {
  const array = COLOR_GRID[channel] as readonly number[];
  const currentIndex = getChannelIndex(channel, currentValue);
  
  if (currentIndex === -1) return null;
  
  let nextIndex: number;
  
  if (channel === 'H') {
    // Hue wraps around
    if (direction === '+') {
      nextIndex = (currentIndex + 1) % array.length;
    } else {
      nextIndex = (currentIndex - 1 + array.length) % array.length;
    }
  } else {
    // S and L have boundaries
    if (direction === '+') {
      nextIndex = currentIndex + 1;
    } else {
      nextIndex = currentIndex - 1;
    }
    
    if (nextIndex < 0 || nextIndex >= array.length) {
      return null;
    }
  }
  
  return array[nextIndex];
}

// Check if a move is legal (single channel change)
export function isLegalMove(from: ColorState, to: ColorState): boolean {
  const changedChannels: Channel[] = [];
  
  (['H', 'S', 'L'] as Channel[]).forEach(ch => {
    if (from[ch] !== to[ch]) {
      changedChannels.push(ch);
    }
  });
  
  // Must change exactly one channel
  if (changedChannels.length !== 1) return false;
  
  const channel = changedChannels[0];
  const direction = to[channel] > from[channel] ? '+' : '-';
  const expectedValue = getNextChannelValue(channel, from[channel], direction);
  
  return expectedValue === to[channel];
}

// HSL to OKLCH conversion for perceptual distance
// Simplified conversion for ΔE calculation
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s = s / 100;
  l = l / 100;
  
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  
  let r = 0, g = 0, b = 0;
  
  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }
  
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

// Simplified perceptual distance (ΔE approximation)
// Uses weighted Euclidean distance in RGB space as a proxy
export function calculateDeltaE(color1: ColorState, color2: ColorState): number {
  const [r1, g1, b1] = hslToRgb(color1.H, color1.S, color1.L);
  const [r2, g2, b2] = hslToRgb(color2.H, color2.S, color2.L);
  
  // Weighted RGB distance (approximates perceptual difference)
  const rMean = (r1 + r2) / 2;
  const deltaR = r1 - r2;
  const deltaG = g1 - g2;
  const deltaB = b1 - b2;
  
  const weightR = 2 + rMean / 256;
  const weightG = 4;
  const weightB = 2 + (255 - rMean) / 256;
  
  return Math.sqrt(
    weightR * deltaR * deltaR +
    weightG * deltaG * deltaG +
    weightB * deltaB * deltaB
  );
}

// Check if a move brings us closer to the goal
export function isCloserToGoal(
  from: ColorState,
  to: ColorState,
  goal: ColorState
): boolean {
  const distanceBefore = calculateDeltaE(from, goal);
  const distanceAfter = calculateDeltaE(to, goal);
  
  return distanceAfter < distanceBefore;
}

// Check if colors are equal
export function colorsEqual(c1: ColorState, c2: ColorState): boolean {
  return c1.H === c2.H && c1.S === c2.S && c1.L === c2.L;
}

// Get available directions for a channel
export function getAvailableDirections(
  color: ColorState,
  channel: Channel
): { plus: boolean; minus: boolean } {
  const plusValue = getNextChannelValue(channel, color[channel], '+');
  const minusValue = getNextChannelValue(channel, color[channel], '-');
  
  return {
    plus: plusValue !== null,
    minus: minusValue !== null,
  };
}
