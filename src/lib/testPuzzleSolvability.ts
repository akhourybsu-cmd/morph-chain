// Test script to verify the hardcoded puzzle is solvable
import { calculateMinDistance } from './prismPuzzleGenerator';
import { ColorState } from './prismColorGrid';

// Hardcoded example puzzle
const start: ColorState = { H: 210, S: 55, L: 60 };
const goal: ColorState = { H: 30, S: 40, L: 70 };

console.log('Testing puzzle solvability...');
console.log('Start:', start);
console.log('Goal:', goal);

const result = calculateMinDistance(start, goal);
console.log('Minimum distance:', result.minDistance);
console.log('Path count:', result.pathCount);
console.log('Is solvable:', result.minDistance !== Infinity && result.minDistance > 0);
console.log('Within move cap (20):', result.minDistance <= 20);

// Manual trace of one possible solution path:
console.log('\nOne possible solution path:');
console.log('1. Start: H=210, S=55, L=60');
console.log('2. H: 210 → 225 (Hue +15)');
console.log('3. H: 225 → 240 (Hue +15)');
console.log('... continue adjusting H to reach 30');
console.log('... adjust S from 55 to 40 (S -15)');
console.log('... adjust L from 60 to 70 (L +10)');
