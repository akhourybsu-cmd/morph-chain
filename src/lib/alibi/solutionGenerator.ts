import { AlibiSolution } from './types';
import { 
  PERSON_NAMES, 
  LOCATION_POOL, 
  TIME_POOL, 
  OBJECT_POOL,
  pickDistinct,
  sortTimes,
  seededShuffle
} from './entityPools';

export interface PuzzleEntities {
  people: string[];
  locations: string[];
  times: string[];
  objects: string[];
}

export function generateEntities(seed: number): PuzzleEntities {
  const people = pickDistinct(PERSON_NAMES, 4, seed);
  const locations = pickDistinct(LOCATION_POOL, 4, seed + 1000);
  const times = sortTimes(pickDistinct(TIME_POOL, 4, seed + 2000));
  const objects = pickDistinct(OBJECT_POOL, 4, seed + 3000);

  return { people, locations, times, objects };
}

export function generateSolution(entities: PuzzleEntities, seed: number): AlibiSolution {
  const { people, locations, times, objects } = entities;

  // Shuffle each category to create random assignments
  const shuffledLocations = seededShuffle(locations, seed + 4000);
  const shuffledTimes = seededShuffle(times, seed + 5000);
  const shuffledObjects = seededShuffle(objects, seed + 6000);

  const personToLocation: Record<string, string> = {};
  const personToTime: Record<string, string> = {};
  const personToObject: Record<string, string> = {};

  people.forEach((person, i) => {
    personToLocation[person] = shuffledLocations[i];
    personToTime[person] = shuffledTimes[i];
    personToObject[person] = shuffledObjects[i];
  });

  return {
    personToLocation,
    personToTime,
    personToObject,
  };
}

// Generate a final question and answer
export function generateFinalQuestion(
  entities: PuzzleEntities,
  solution: AlibiSolution,
  seed: number
): { question: string; answer: string } {
  const rand = (s: number) => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const questionTypes = [
    // Who had the object?
    () => {
      const obj = entities.objects[Math.floor(rand(seed) * entities.objects.length)];
      const answer = Object.entries(solution.personToObject)
        .find(([_, o]) => o === obj)?.[0] || '';
      return { question: `Who had the ${obj}?`, answer };
    },
    // Who was at the location?
    () => {
      const loc = entities.locations[Math.floor(rand(seed + 1) * entities.locations.length)];
      const answer = Object.entries(solution.personToLocation)
        .find(([_, l]) => l === loc)?.[0] || '';
      return { question: `Who was at the ${loc}?`, answer };
    },
    // Who was there at time?
    () => {
      const time = entities.times[Math.floor(rand(seed + 2) * entities.times.length)];
      const answer = Object.entries(solution.personToTime)
        .find(([_, t]) => t === time)?.[0] || '';
      return { question: `Who was seen at ${time}?`, answer };
    },
  ];

  const questionType = questionTypes[Math.floor(rand(seed + 10) * questionTypes.length)];
  return questionType();
}
