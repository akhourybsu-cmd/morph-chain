import { AlibiClue, AlibiSolution, ClueType } from './types';

interface ClueContext {
  people: string[];
  locations: string[];
  times: string[];
  objects: string[];
  solution: AlibiSolution;
}

type ClueGenerator = (ctx: ClueContext, seed: number) => AlibiClue | null;

// Seeded random helper
function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickRandom<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

function pickTwoDistinct<T>(arr: T[], rand: () => number): [T, T] {
  const shuffled = [...arr].sort(() => rand() - 0.5);
  return [shuffled[0], shuffled[1]];
}

// Get time index for comparison
function getTimeIndex(time: string, times: string[]): number {
  return times.indexOf(time);
}

// Direct positive clue generators
const directPositiveGenerators: ClueGenerator[] = [
  // Person was at location
  (ctx, seed) => {
    const rand = seededRandom(seed);
    const person = pickRandom(ctx.people, rand);
    const location = ctx.solution.personToLocation[person];
    const templates = [
      `${person} was at the ${location}.`,
      `${person} visited the ${location}.`,
      `${person} spent time at the ${location}.`,
    ];
    return {
      id: `dp_loc_${person}_${seed}`,
      type: 'direct_positive',
      text: pickRandom(templates, rand),
    };
  },
  // Person had object
  (ctx, seed) => {
    const rand = seededRandom(seed);
    const person = pickRandom(ctx.people, rand);
    const object = ctx.solution.personToObject[person];
    const templates = [
      `${person} had the ${object}.`,
      `${person} was carrying the ${object}.`,
      `The ${object} belonged to ${person}.`,
    ];
    return {
      id: `dp_obj_${person}_${seed}`,
      type: 'direct_positive',
      text: pickRandom(templates, rand),
    };
  },
  // Person was there at time
  (ctx, seed) => {
    const rand = seededRandom(seed);
    const person = pickRandom(ctx.people, rand);
    const time = ctx.solution.personToTime[person];
    const templates = [
      `${person} was seen at ${time}.`,
      `${person} arrived at ${time}.`,
      `At ${time}, ${person} was spotted.`,
    ];
    return {
      id: `dp_time_${person}_${seed}`,
      type: 'direct_positive',
      text: pickRandom(templates, rand),
    };
  },
  // Object was at location (cross-category)
  (ctx, seed) => {
    const rand = seededRandom(seed);
    const person = pickRandom(ctx.people, rand);
    const object = ctx.solution.personToObject[person];
    const location = ctx.solution.personToLocation[person];
    const templates = [
      `The ${object} was seen at the ${location}.`,
      `Someone with the ${object} was at the ${location}.`,
    ];
    return {
      id: `dp_obj_loc_${seed}`,
      type: 'direct_positive',
      text: pickRandom(templates, rand),
    };
  },
];

// Direct negative clue generators
const directNegativeGenerators: ClueGenerator[] = [
  // Person wasn't at two locations
  (ctx, seed) => {
    const rand = seededRandom(seed);
    const person = pickRandom(ctx.people, rand);
    const actualLocation = ctx.solution.personToLocation[person];
    const otherLocations = ctx.locations.filter(l => l !== actualLocation);
    if (otherLocations.length < 2) return null;
    const [loc1, loc2] = pickTwoDistinct(otherLocations, rand);
    return {
      id: `dn_loc_${person}_${seed}`,
      type: 'direct_negative',
      text: `${person} wasn't at the ${loc1} or the ${loc2}.`,
    };
  },
  // Person didn't have object
  (ctx, seed) => {
    const rand = seededRandom(seed);
    const person = pickRandom(ctx.people, rand);
    const actualObject = ctx.solution.personToObject[person];
    const otherObjects = ctx.objects.filter(o => o !== actualObject);
    if (otherObjects.length === 0) return null;
    const wrongObject = pickRandom(otherObjects, rand);
    return {
      id: `dn_obj_${person}_${seed}`,
      type: 'direct_negative',
      text: `${person} did not have the ${wrongObject}.`,
    };
  },
  // Person wasn't there at time
  (ctx, seed) => {
    const rand = seededRandom(seed);
    const person = pickRandom(ctx.people, rand);
    const actualTime = ctx.solution.personToTime[person];
    const otherTimes = ctx.times.filter(t => t !== actualTime);
    if (otherTimes.length === 0) return null;
    const wrongTime = pickRandom(otherTimes, rand);
    return {
      id: `dn_time_${person}_${seed}`,
      type: 'direct_negative',
      text: `${person} wasn't seen at ${wrongTime}.`,
    };
  },
];

// Relational clue generators
const relationalGenerators: ClueGenerator[] = [
  // Person1 arrived earlier than Person2
  (ctx, seed) => {
    const rand = seededRandom(seed);
    const [p1, p2] = pickTwoDistinct(ctx.people, rand);
    const t1 = getTimeIndex(ctx.solution.personToTime[p1], ctx.times);
    const t2 = getTimeIndex(ctx.solution.personToTime[p2], ctx.times);
    if (t1 >= t2) return null;
    return {
      id: `rel_earlier_${p1}_${p2}_${seed}`,
      type: 'relational',
      text: `${p1} arrived earlier than ${p2}.`,
    };
  },
  // Person1 arrived later than Person2
  (ctx, seed) => {
    const rand = seededRandom(seed);
    const [p1, p2] = pickTwoDistinct(ctx.people, rand);
    const t1 = getTimeIndex(ctx.solution.personToTime[p1], ctx.times);
    const t2 = getTimeIndex(ctx.solution.personToTime[p2], ctx.times);
    if (t1 <= t2) return null;
    return {
      id: `rel_later_${p1}_${p2}_${seed}`,
      type: 'relational',
      text: `${p1} arrived later than ${p2}.`,
    };
  },
  // The person at location arrived before person
  (ctx, seed) => {
    const rand = seededRandom(seed);
    const [p1, p2] = pickTwoDistinct(ctx.people, rand);
    const loc1 = ctx.solution.personToLocation[p1];
    const t1 = getTimeIndex(ctx.solution.personToTime[p1], ctx.times);
    const t2 = getTimeIndex(ctx.solution.personToTime[p2], ctx.times);
    if (t1 >= t2) return null;
    return {
      id: `rel_loc_before_${seed}`,
      type: 'relational',
      text: `The person at the ${loc1} arrived before ${p2}.`,
    };
  },
  // The person with object arrived after person
  (ctx, seed) => {
    const rand = seededRandom(seed);
    const [p1, p2] = pickTwoDistinct(ctx.people, rand);
    const obj1 = ctx.solution.personToObject[p1];
    const t1 = getTimeIndex(ctx.solution.personToTime[p1], ctx.times);
    const t2 = getTimeIndex(ctx.solution.personToTime[p2], ctx.times);
    if (t1 <= t2) return null;
    return {
      id: `rel_obj_after_${seed}`,
      type: 'relational',
      text: `The person with the ${obj1} arrived after ${p2}.`,
    };
  },
];

export function generateCandidateClues(ctx: ClueContext, baseSeed: number): AlibiClue[] {
  const clues: AlibiClue[] = [];
  const allGenerators = [
    ...directPositiveGenerators,
    ...directNegativeGenerators,
    ...relationalGenerators,
  ];

  // Generate multiple clues from each generator with different seeds
  for (let i = 0; i < 50; i++) {
    for (const generator of allGenerators) {
      const clue = generator(ctx, baseSeed + i * 100);
      if (clue) {
        // Avoid duplicates by checking text
        if (!clues.some(c => c.text === clue.text)) {
          clues.push(clue);
        }
      }
    }
  }

  return clues;
}

export function getCluesByType(clues: AlibiClue[], type: ClueType): AlibiClue[] {
  return clues.filter(c => c.type === type);
}
