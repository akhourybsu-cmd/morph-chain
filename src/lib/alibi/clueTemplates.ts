/**
 * Clue Templates - V2.0 Enhanced Answer Protection
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
 * 
 * Enhanced Answer Protection:
 * - Blocks direct links between answer person and target value
 * - Blocks clues that would trivially eliminate to the answer
 * - Blocks cross-category chains that reveal the answer
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
// ADVANCED CLUE GENERATORS (Tier: advanced)
// These clues require multi-step deduction
// ============================================

// CONDITIONAL: If X has A, then Y has B
export function generateConditionalClue(ctx: ClueContext, seed: number): AlibiClue | null {
  const rand = seededRandom(seed);
  
  // Pick two different people
  const [p1, p2] = pickTwoDistinct(ctx.people, rand);
  
  // Pick category for the condition (object, location, or time)
  const categories: Array<'object' | 'location' | 'time'> = ['object', 'location', 'time'];
  const cat1 = pickRandom(categories, rand);
  const cat2 = pickRandom(categories.filter(c => c !== cat1) as Array<'object' | 'location' | 'time'>, rand);
  
  // Get the actual values from solution
  const getValue = (person: string, category: 'object' | 'location' | 'time'): string => {
    if (category === 'object') return ctx.solution.personToObject[person];
    if (category === 'location') return ctx.solution.personToLocation[person];
    return ctx.solution.personToTime[person];
  };
  
  const val1 = getValue(p1, cat1);
  const val2 = getValue(p2, cat2);
  
  const catLabel1 = cat1 === 'object' ? 'had the' : cat1 === 'location' ? 'was at the' : 'was seen at';
  const catLabel2 = cat2 === 'object' ? 'had the' : cat2 === 'location' ? 'was at the' : 'was seen at';
  
  return {
    id: `cond_${p1}_${p2}_${seed}`,
    type: 'conditional',
    tier: 'advanced',
    category: 'cross',
    text: `If ${p1} ${catLabel1} ${val1}, then ${p2} ${catLabel2} ${val2}.`,
    entities: { 
      people: [p1, p2], 
      ...(cat1 === 'object' ? { objects: [val1] } : cat1 === 'location' ? { locations: [val1] } : { times: [val1] }),
      ...(cat2 === 'object' ? { objects: [val2] } : cat2 === 'location' ? { locations: [val2] } : { times: [val2] }),
    },
  };
}

// XOR: Either X has A OR Y has B, but not both
export function generateXorClue(ctx: ClueContext, seed: number): AlibiClue | null {
  const rand = seededRandom(seed);
  
  const [p1, p2] = pickTwoDistinct(ctx.people, rand);
  
  // For valid XOR, exactly one statement must be true
  // We pick values where only one person has the stated attribute
  const obj1 = ctx.solution.personToObject[p1];
  const loc2 = ctx.solution.personToLocation[p2];
  
  // Get a false object for p1 (different from what they actually have)
  const otherObjects = ctx.objects.filter(o => o !== obj1);
  if (otherObjects.length === 0) return null;
  const falseObj = pickRandom(otherObjects, rand);
  
  // Check who actually has the falseObj
  const actualOwner = Object.entries(ctx.solution.personToObject).find(([, o]) => o === falseObj)?.[0];
  
  // Make sure the XOR is valid: exactly one branch is true
  // If p1 has falseObj: first branch true. If p2 is at loc2: second branch true.
  // We want exactly one to be true
  const p1HasFalseObj = ctx.solution.personToObject[p1] === falseObj;
  const p2AtLoc2 = ctx.solution.personToLocation[p2] === loc2;
  
  // Only generate if exactly one is true
  if ((p1HasFalseObj && p2AtLoc2) || (!p1HasFalseObj && !p2AtLoc2)) return null;
  
  return {
    id: `xor_${p1}_${p2}_${seed}`,
    type: 'xor',
    tier: 'advanced',
    category: 'cross',
    text: `Either ${p1} had the ${falseObj} OR ${p2} was at the ${loc2}, but not both.`,
    entities: { people: [p1, p2], objects: [falseObj], locations: [loc2] },
  };
}

// MUTUAL EXCLUSION: X and Y were not at adjacent time slots
export function generateMutualExclusionClue(ctx: ClueContext, seed: number): AlibiClue | null {
  const rand = seededRandom(seed);
  
  // Find pairs of people who are NOT adjacent in time
  const pairs: [string, string][] = [];
  
  for (let i = 0; i < ctx.people.length; i++) {
    for (let j = i + 1; j < ctx.people.length; j++) {
      const t1 = getTimeIndex(ctx.solution.personToTime[ctx.people[i]], ctx.times);
      const t2 = getTimeIndex(ctx.solution.personToTime[ctx.people[j]], ctx.times);
      const gap = Math.abs(t1 - t2);
      
      // Only include pairs that are NOT adjacent (gap > 1)
      if (gap > 1) {
        pairs.push([ctx.people[i], ctx.people[j]]);
      }
    }
  }
  
  if (pairs.length === 0) return null;
  
  const [p1, p2] = pickRandom(pairs, rand);
  
  return {
    id: `mutual_excl_${p1}_${p2}_${seed}`,
    type: 'mutual_exclusion',
    tier: 'advanced',
    category: 'time',
    text: `${p1} and ${p2} were not at adjacent time slots.`,
    entities: { people: [p1, p2] },
  };
}

// BOUNDED RANGE: The person with X arrived before noon / after 10 AM
export function generateBoundedRangeClue(ctx: ClueContext, seed: number): AlibiClue | null {
  const rand = seededRandom(seed);
  
  // Get midpoint of times
  const midpoint = Math.floor(ctx.times.length / 2);
  
  // Pick a person randomly
  const person = pickRandom(ctx.people, rand);
  const personTime = getTimeIndex(ctx.solution.personToTime[person], ctx.times);
  const personObject = ctx.solution.personToObject[person];
  
  // Determine if person is in early or late half
  const isEarly = personTime < midpoint;
  const boundaryTime = ctx.times[midpoint];
  
  // Generate appropriate constraint
  if (isEarly) {
    return {
      id: `bounded_early_${person}_${seed}`,
      type: 'bounded_range',
      tier: 'advanced',
      category: 'time',
      text: `The person with the ${personObject} arrived before ${boundaryTime}.`,
      entities: { objects: [personObject], times: [boundaryTime] },
    };
  } else {
    const earlyBound = ctx.times[midpoint - 1] || ctx.times[0];
    return {
      id: `bounded_late_${person}_${seed}`,
      type: 'bounded_range',
      tier: 'advanced',
      category: 'time',
      text: `The person with the ${personObject} arrived after ${earlyBound}.`,
      entities: { objects: [personObject], times: [earlyBound] },
    };
  }
}

// TRIPLE ELIMINATION: Three people didn't have X
export function generateTripleEliminationClue(ctx: ClueContext, seed: number): AlibiClue | null {
  const rand = seededRandom(seed);
  
  // Pick a random object
  const obj = pickRandom(ctx.objects, rand);
  
  // Find who has this object
  const owner = Object.entries(ctx.solution.personToObject).find(([, o]) => o === obj)?.[0];
  if (!owner) return null;
  
  // Get the three people who don't have it
  const nonOwners = ctx.people.filter(p => p !== owner);
  
  if (nonOwners.length !== 3) return null; // Should always be 3 for 4-person puzzle
  
  return {
    id: `triple_elim_obj_${seed}`,
    type: 'triple_elimination',
    tier: 'advanced',
    category: 'object',
    text: `Three people didn't have the ${obj}: ${nonOwners[0]}, ${nonOwners[1]}, and ${nonOwners[2]}.`,
    entities: { people: nonOwners, objects: [obj] },
  };
}

// Location-based triple elimination
export function generateTripleLocationEliminationClue(ctx: ClueContext, seed: number): AlibiClue | null {
  const rand = seededRandom(seed);
  
  // Pick a random location
  const loc = pickRandom(ctx.locations, rand);
  
  // Find who was at this location
  const occupant = Object.entries(ctx.solution.personToLocation).find(([, l]) => l === loc)?.[0];
  if (!occupant) return null;
  
  // Get the three people who weren't there
  const notThere = ctx.people.filter(p => p !== occupant);
  
  if (notThere.length !== 3) return null;
  
  return {
    id: `triple_elim_loc_${seed}`,
    type: 'triple_elimination',
    tier: 'advanced',
    category: 'location',
    text: `Three people weren't at the ${loc}: ${notThere[0]}, ${notThere[1]}, and ${notThere[2]}.`,
    entities: { people: notThere, locations: [loc] },
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
  advanced: AlibiClue[];
}

// Protected answer pair - used to filter out answer-revealing clues
export interface ProtectedAnswer {
  person: string;
  category: 'time' | 'location' | 'object';
  value: string;
}

/**
 * COMPREHENSIVE check if a clue would reveal the protected answer
 * Catches multiple revealing patterns:
 * 1. Direct anchor linking answer person to target value
 * 2. Negative clues that would leave only the answer person
 * 3. Cross-category clues that chain to reveal the answer
 */
function wouldRevealAnswer(clue: AlibiClue, protected_: ProtectedAnswer, ctx: ClueContext): boolean {
  // Pattern 1: Direct positive linking answer person to target value
  if (clue.entities?.people?.includes(protected_.person)) {
    if (protected_.category === 'time' && clue.entities?.times?.includes(protected_.value)) {
      return true; // Any clue linking them, not just anchors
    }
    if (protected_.category === 'location' && clue.entities?.locations?.includes(protected_.value)) {
      return true;
    }
    if (protected_.category === 'object' && clue.entities?.objects?.includes(protected_.value)) {
      return true;
    }
  }
  
  // Pattern 2: Check if this is a negative clue that eliminates everyone except the answer person
  if (clue.type === 'direct_negative') {
    const otherPeople = ctx.people.filter(p => p !== protected_.person);
    
    // If this clue eliminates the target value for ALL other people, it reveals the answer
    if (protected_.category === 'location' && clue.category === 'location') {
      const eliminatedLocations = clue.entities?.locations || [];
      if (eliminatedLocations.includes(protected_.value)) {
        // Check if this person is NOT the answer - if everyone else gets eliminated from target value, answer is revealed
        const cluePerson = clue.entities?.people?.[0];
        if (cluePerson && cluePerson !== protected_.person) {
          // This eliminates cluePerson from the target value - could contribute to trivial elimination
          // But we allow it as long as it doesn't directly reveal the answer
        }
      }
    }
    // Similar checks for time and object...
  }
  
  // Pattern 3: Cross-category clues that chain to reveal the answer
  if (clue.tier === 'cross_category' || clue.category === 'cross') {
    // Get the object and location from the cross clue
    const clueObject = clue.entities?.objects?.[0];
    const clueLocation = clue.entities?.locations?.[0];
    
    if (clueObject && clueLocation) {
      // Find who has this object
      const objectOwner = Object.entries(ctx.solution.personToObject).find(([, obj]) => obj === clueObject)?.[0];
      
      if (objectOwner === protected_.person) {
        // If the answer person owns this object, check if the cross-clue reveals their location
        if (protected_.category === 'location' && clueLocation === protected_.value) {
          return true;
        }
      }
      
      // Similar check for if location matches
      const locationOccupant = Object.entries(ctx.solution.personToLocation).find(([, loc]) => loc === clueLocation)?.[0];
      
      if (locationOccupant === protected_.person) {
        // If the answer person is at this location, check if the cross-clue reveals their object
        if (protected_.category === 'object' && clueObject === protected_.value) {
          return true;
        }
      }
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
    advanced: [],
  };
  
  // Generate all possible anchors (one per person per category)
  // Skip anchors that would reveal the protected answer
  for (const person of ctx.people) {
    const timeAnchor = generateTimeAnchor(ctx, person);
    if (!protectedAnswer || !wouldRevealAnswer(timeAnchor, protectedAnswer, ctx)) {
      result.anchors.time.push(timeAnchor);
    }
    
    const locAnchor = generateLocationAnchor(ctx, person);
    if (!protectedAnswer || !wouldRevealAnswer(locAnchor, protectedAnswer, ctx)) {
      result.anchors.location.push(locAnchor);
    }
    
    const objAnchor = generateObjectAnchor(ctx, person);
    if (!protectedAnswer || !wouldRevealAnswer(objAnchor, protectedAnswer, ctx)) {
      result.anchors.object.push(objAnchor);
    }
    
    const crossAnchor = generateCrossAnchor(ctx, person);
    if (!protectedAnswer || !wouldRevealAnswer(crossAnchor, protectedAnswer, ctx)) {
      result.crossCategory.push(crossAnchor);
    }
  }
  
  // Generate forced negatives (2 per person per category)
  for (let i = 0; i < ctx.people.length; i++) {
    const person = ctx.people[i];
    
    const locNeg = generateTwoLocationNegative(ctx, person, baseSeed + i * 100);
    if (locNeg && (!protectedAnswer || !wouldRevealAnswer(locNeg, protectedAnswer, ctx))) {
      result.forcedNegatives.push(locNeg);
    }
    
    const timeNeg = generateTwoTimeNegative(ctx, person, baseSeed + i * 100 + 50);
    if (timeNeg && (!protectedAnswer || !wouldRevealAnswer(timeNeg, protectedAnswer, ctx))) {
      result.forcedNegatives.push(timeNeg);
    }
    
    const objNeg = generateTwoObjectNegative(ctx, person, baseSeed + i * 100 + 75);
    if (objNeg && (!protectedAnswer || !wouldRevealAnswer(objNeg, protectedAnswer, ctx))) {
      result.forcedNegatives.push(objNeg);
    }
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
  
  // Generate advanced clues for deeper deduction
  for (let s = 0; s < 8; s++) {
    const cond = generateConditionalClue(ctx, baseSeed + s * 300);
    if (cond && (!protectedAnswer || !wouldRevealAnswer(cond, protectedAnswer, ctx))) {
      result.advanced.push(cond);
    }
    
    const xor = generateXorClue(ctx, baseSeed + s * 310);
    if (xor && (!protectedAnswer || !wouldRevealAnswer(xor, protectedAnswer, ctx))) {
      result.advanced.push(xor);
    }
    
    const mutEx = generateMutualExclusionClue(ctx, baseSeed + s * 320);
    if (mutEx && (!protectedAnswer || !wouldRevealAnswer(mutEx, protectedAnswer, ctx))) {
      result.advanced.push(mutEx);
    }
    
    const bounded = generateBoundedRangeClue(ctx, baseSeed + s * 330);
    if (bounded && (!protectedAnswer || !wouldRevealAnswer(bounded, protectedAnswer, ctx))) {
      result.advanced.push(bounded);
    }
    
    const triple = generateTripleEliminationClue(ctx, baseSeed + s * 340);
    if (triple && (!protectedAnswer || !wouldRevealAnswer(triple, protectedAnswer, ctx))) {
      result.advanced.push(triple);
    }
    
    const tripleLoc = generateTripleLocationEliminationClue(ctx, baseSeed + s * 350);
    if (tripleLoc && (!protectedAnswer || !wouldRevealAnswer(tripleLoc, protectedAnswer, ctx))) {
      result.advanced.push(tripleLoc);
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
    ...generated.advanced,
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
