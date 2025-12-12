/**
 * Clue Templates - V1.0 Ruleset Implementation
 * 
 * Clues are organized by tier (Section 3):
 * - Tier 1: Direct Anchors (required first)
 * - Tier 2: Forced Negatives (only if resolving)
 * - Tier 3: Relational (heavily restricted)
 * 
 * Language Clarity Rules (Section 10):
 * - Single-sentence
 * - Declarative (no ambiguity)
 * - No pronouns ("they", "someone", "that person")
 * - Max 2 entities per clause
 */

import { AlibiClue, AlibiSolution, ClueType, ClueTier, ClueCategory } from './types';

interface ClueContext {
  people: string[];
  locations: string[];
  times: string[];
  objects: string[];
  solution: AlibiSolution;
}

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

function getTimeIndex(time: string, times: string[]): number {
  return times.indexOf(time);
}

// ============================================
// TIER 1: ANCHOR GENERATORS (Section 3.1)
// These clues must appear early and force immediate marks
// ============================================

export function generateTimeAnchor(ctx: ClueContext, person: string): AlibiClue {
  const time = ctx.solution.personToTime[person];
  return {
    id: `anchor_time_${person}`,
    type: 'direct_positive',
    tier: 'anchor',
    category: 'time',
    text: `${person} was seen at ${time}.`,
    entities: { people: [person], times: [time] },
  };
}

export function generateLocationAnchor(ctx: ClueContext, person: string): AlibiClue {
  const location = ctx.solution.personToLocation[person];
  return {
    id: `anchor_loc_${person}`,
    type: 'direct_positive',
    tier: 'anchor',
    category: 'location',
    text: `${person} was at the ${location}.`,
    entities: { people: [person], locations: [location] },
  };
}

export function generateObjectAnchor(ctx: ClueContext, person: string): AlibiClue {
  const object = ctx.solution.personToObject[person];
  return {
    id: `anchor_obj_${person}`,
    type: 'direct_positive',
    tier: 'anchor',
    category: 'object',
    text: `${person} had the ${object}.`,
    entities: { people: [person], objects: [object] },
  };
}

// Cross-category anchor: Object at Location
export function generateCrossAnchor(ctx: ClueContext, person: string): AlibiClue {
  const object = ctx.solution.personToObject[person];
  const location = ctx.solution.personToLocation[person];
  return {
    id: `anchor_cross_${person}`,
    type: 'direct_positive',
    tier: 'cross_category',
    category: 'cross',
    text: `The ${object} was seen at the ${location}.`,
    entities: { objects: [object], locations: [location] },
  };
}

// ============================================
// TIER 2: FORCED NEGATIVE GENERATORS (Section 3.2)
// Only generate if they eliminate ≥50% of remaining options
// ============================================

export function generateTwoLocationNegative(ctx: ClueContext, person: string, seed: number): AlibiClue | null {
  const rand = seededRandom(seed);
  const actualLocation = ctx.solution.personToLocation[person];
  const otherLocations = ctx.locations.filter(l => l !== actualLocation);
  
  if (otherLocations.length < 2) return null;
  
  // Pick 2 locations to eliminate (eliminates 50% of 4 locations)
  const [loc1, loc2] = pickTwoDistinct(otherLocations, rand);
  
  return {
    id: `neg_loc_${person}_${seed}`,
    type: 'direct_negative',
    tier: 'forced_negative',
    category: 'location',
    text: `${person} wasn't at the ${loc1} or the ${loc2}.`,
    entities: { people: [person], locations: [loc1, loc2] },
  };
}

export function generateTwoTimeNegative(ctx: ClueContext, person: string, seed: number): AlibiClue | null {
  const rand = seededRandom(seed);
  const actualTime = ctx.solution.personToTime[person];
  const otherTimes = ctx.times.filter(t => t !== actualTime);
  
  if (otherTimes.length < 2) return null;
  
  const [time1, time2] = pickTwoDistinct(otherTimes, rand);
  
  return {
    id: `neg_time_${person}_${seed}`,
    type: 'direct_negative',
    tier: 'forced_negative',
    category: 'time',
    text: `${person} wasn't seen at ${time1} or ${time2}.`,
    entities: { people: [person], times: [time1, time2] },
  };
}

export function generateTwoObjectNegative(ctx: ClueContext, person: string, seed: number): AlibiClue | null {
  const rand = seededRandom(seed);
  const actualObject = ctx.solution.personToObject[person];
  const otherObjects = ctx.objects.filter(o => o !== actualObject);
  
  if (otherObjects.length < 2) return null;
  
  const [obj1, obj2] = pickTwoDistinct(otherObjects, rand);
  
  return {
    id: `neg_obj_${person}_${seed}`,
    type: 'direct_negative',
    tier: 'forced_negative',
    category: 'object',
    text: `${person} did not have the ${obj1} or the ${obj2}.`,
    entities: { people: [person], objects: [obj1, obj2] },
  };
}

// ============================================
// TIER 3: RELATIONAL GENERATORS (Section 3.3)
// Only allowed if they collapse to a single ordering
// ============================================

// Exact time gap (allowed: terminates to specific position)
export function generateExactTimeGap(ctx: ClueContext, p1: string, p2: string): AlibiClue | null {
  const t1 = getTimeIndex(ctx.solution.personToTime[p1], ctx.times);
  const t2 = getTimeIndex(ctx.solution.personToTime[p2], ctx.times);
  
  if (t1 >= t2) return null; // p1 must be before p2
  
  const gap = t2 - t1;
  
  return {
    id: `rel_exact_${p1}_${p2}`,
    type: 'relational',
    tier: 'relational',
    category: 'time',
    text: `${p1} arrived exactly ${gap} time slot${gap > 1 ? 's' : ''} before ${p2}.`,
    entities: { people: [p1, p2] },
  };
}

// Terminated relative (only valid when p2 has an anchor)
export function generateTerminatedRelative(ctx: ClueContext, p1: string, p2: string, p2HasAnchor: boolean): AlibiClue | null {
  if (!p2HasAnchor) return null; // Reject if p2 doesn't have a time anchor
  
  const t1 = getTimeIndex(ctx.solution.personToTime[p1], ctx.times);
  const t2 = getTimeIndex(ctx.solution.personToTime[p2], ctx.times);
  
  if (t1 >= t2) return null;
  
  return {
    id: `rel_term_${p1}_${p2}`,
    type: 'relational',
    tier: 'relational',
    category: 'time',
    text: `${p1} arrived earlier than ${p2}.`,
    entities: { people: [p1, p2] },
  };
}

// Chained order (3 people in sequence - closes the chain)
export function generateChainedOrder(ctx: ClueContext, seed: number): AlibiClue | null {
  // Sort people by their actual time
  const sorted = [...ctx.people].sort((a, b) => {
    const ta = getTimeIndex(ctx.solution.personToTime[a], ctx.times);
    const tb = getTimeIndex(ctx.solution.personToTime[b], ctx.times);
    return ta - tb;
  });
  
  // Pick 3 consecutive people from the sorted list
  const rand = seededRandom(seed);
  const startIdx = Math.floor(rand() * 2); // 0 or 1 for 4 people
  const [p1, p2, p3] = sorted.slice(startIdx, startIdx + 3);
  
  if (!p1 || !p2 || !p3) return null;
  
  return {
    id: `rel_chain_${seed}`,
    type: 'relational',
    tier: 'relational',
    category: 'time',
    text: `${p1} arrived before ${p2}, who arrived before ${p3}.`,
    entities: { people: [p1, p2, p3] },
  };
}

// ============================================
// CLUE GENERATION ORCHESTRATOR
// ============================================

export interface GeneratedClues {
  anchors: {
    time: AlibiClue[];
    location: AlibiClue[];
    object: AlibiClue[];
  };
  forcedNegatives: AlibiClue[];
  relationals: AlibiClue[];
  crossCategory: AlibiClue[];
}

// Protected answer pair - used to filter out answer-revealing clues
export interface ProtectedAnswer {
  person: string;
  category: 'time' | 'location' | 'object';
  value: string;
}

/**
 * Check if a clue would reveal the protected answer
 */
function wouldRevealAnswer(clue: AlibiClue, protected_: ProtectedAnswer): boolean {
  // Check if this clue directly links the answer person to the target value
  if (clue.entities?.people?.includes(protected_.person)) {
    if (protected_.category === 'time' && clue.entities?.times?.includes(protected_.value)) {
      return clue.tier === 'anchor' && clue.category === 'time';
    }
    if (protected_.category === 'location' && clue.entities?.locations?.includes(protected_.value)) {
      return clue.tier === 'anchor' && clue.category === 'location';
    }
    if (protected_.category === 'object' && clue.entities?.objects?.includes(protected_.value)) {
      return clue.tier === 'anchor' && clue.category === 'object';
    }
  }
  return false;
}

export function generateAllCandidateClues(
  ctx: ClueContext, 
  baseSeed: number,
  protectedAnswer?: ProtectedAnswer
): GeneratedClues {
  const result: GeneratedClues = {
    anchors: { time: [], location: [], object: [] },
    forcedNegatives: [],
    relationals: [],
    crossCategory: [],
  };
  
  // Generate all possible anchors (one per person per category)
  // Skip anchors that would reveal the protected answer
  for (const person of ctx.people) {
    const timeAnchor = generateTimeAnchor(ctx, person);
    if (!protectedAnswer || !wouldRevealAnswer(timeAnchor, protectedAnswer)) {
      result.anchors.time.push(timeAnchor);
    }
    
    const locAnchor = generateLocationAnchor(ctx, person);
    if (!protectedAnswer || !wouldRevealAnswer(locAnchor, protectedAnswer)) {
      result.anchors.location.push(locAnchor);
    }
    
    const objAnchor = generateObjectAnchor(ctx, person);
    if (!protectedAnswer || !wouldRevealAnswer(objAnchor, protectedAnswer)) {
      result.anchors.object.push(objAnchor);
    }
    
    result.crossCategory.push(generateCrossAnchor(ctx, person));
  }
  
  // Generate forced negatives (2 per person per category)
  for (let i = 0; i < ctx.people.length; i++) {
    const person = ctx.people[i];
    
    const locNeg = generateTwoLocationNegative(ctx, person, baseSeed + i * 100);
    if (locNeg) result.forcedNegatives.push(locNeg);
    
    const timeNeg = generateTwoTimeNegative(ctx, person, baseSeed + i * 100 + 50);
    if (timeNeg) result.forcedNegatives.push(timeNeg);
    
    const objNeg = generateTwoObjectNegative(ctx, person, baseSeed + i * 100 + 75);
    if (objNeg) result.forcedNegatives.push(objNeg);
  }
  
  // Generate relational clues
  for (let i = 0; i < ctx.people.length; i++) {
    for (let j = 0; j < ctx.people.length; j++) {
      if (i === j) continue;
      
      const exactGap = generateExactTimeGap(ctx, ctx.people[i], ctx.people[j]);
      if (exactGap) result.relationals.push(exactGap);
    }
  }
  
  // Generate chained order variations
  for (let s = 0; s < 5; s++) {
    const chain = generateChainedOrder(ctx, baseSeed + s * 200);
    if (chain && !result.relationals.some(r => r.text === chain.text)) {
      result.relationals.push(chain);
    }
  }
  
  return result;
}

// Legacy compatibility
export function generateCandidateClues(ctx: ClueContext, baseSeed: number): AlibiClue[] {
  const generated = generateAllCandidateClues(ctx, baseSeed);
  return [
    ...generated.anchors.time,
    ...generated.anchors.location,
    ...generated.anchors.object,
    ...generated.crossCategory,
    ...generated.forcedNegatives,
    ...generated.relationals,
  ];
}

export function getCluesByType(clues: AlibiClue[], type: ClueType): AlibiClue[] {
  return clues.filter(c => c.type === type);
}

export function getCluesByTier(clues: AlibiClue[], tier: ClueTier): AlibiClue[] {
  return clues.filter(c => c.tier === tier);
}

export function getCluesByCategory(clues: AlibiClue[], category: ClueCategory): AlibiClue[] {
  return clues.filter(c => c.category === category);
}
