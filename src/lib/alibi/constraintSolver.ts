import { AlibiClue, AlibiSolution } from './types';

interface SolverState {
  personToLocation: Record<string, string | null>;
  personToTime: Record<string, string | null>;
  personToObject: Record<string, string | null>;
  locationToPerson: Record<string, string | null>;
  timeToPerson: Record<string, string | null>;
  objectToPerson: Record<string, string | null>;
  // Tracking what's ruled out
  ruledOut: {
    personLocation: Set<string>;
    personTime: Set<string>;
    personObject: Set<string>;
  };
}

interface Constraint {
  type: string;
  check: (state: SolverState, entities: SolverEntities) => boolean;
  apply?: (state: SolverState, entities: SolverEntities) => void;
}

interface SolverEntities {
  people: string[];
  locations: string[];
  times: string[];
  objects: string[];
}

// Parse clue text into constraints
export function parseClueToConstraints(clue: AlibiClue, entities: SolverEntities): Constraint[] {
  const constraints: Constraint[] = [];
  const text = clue.text;

  // Direct positive: "{person} was at the {location}."
  const wasAtMatch = text.match(/^(\w+) (?:was at|visited|spent time at) the (\w+)\.$/);
  if (wasAtMatch) {
    const [, person, location] = wasAtMatch;
    if (entities.people.includes(person) && entities.locations.includes(location)) {
      constraints.push({
        type: 'person_at_location',
        check: (state) => state.personToLocation[person] === null || state.personToLocation[person] === location,
        apply: (state) => {
          state.personToLocation[person] = location;
          state.locationToPerson[location] = person;
        },
      });
    }
  }

  // Direct positive: "{person} had the {object}."
  const hadMatch = text.match(/^(\w+) (?:had|was carrying) the (\w+)\.$/);
  if (hadMatch) {
    const [, person, object] = hadMatch;
    if (entities.people.includes(person) && entities.objects.includes(object)) {
      constraints.push({
        type: 'person_has_object',
        check: (state) => state.personToObject[person] === null || state.personToObject[person] === object,
        apply: (state) => {
          state.personToObject[person] = object;
          state.objectToPerson[object] = person;
        },
      });
    }
  }

  // Direct positive: "The {object} belonged to {person}."
  const belongedMatch = text.match(/^The (\w+) belonged to (\w+)\.$/);
  if (belongedMatch) {
    const [, object, person] = belongedMatch;
    if (entities.people.includes(person) && entities.objects.includes(object)) {
      constraints.push({
        type: 'person_has_object',
        check: (state) => state.personToObject[person] === null || state.personToObject[person] === object,
      });
    }
  }

  // Direct positive: "{person} was seen at {time}."
  const seenAtMatch = text.match(/^(\w+) (?:was seen|arrived) at ([\d:]+ [AP]M)\.$/);
  if (seenAtMatch) {
    const [, person, time] = seenAtMatch;
    if (entities.people.includes(person) && entities.times.includes(time)) {
      constraints.push({
        type: 'person_at_time',
        check: (state) => state.personToTime[person] === null || state.personToTime[person] === time,
      });
    }
  }

  // Direct negative: "{person} wasn't at the {loc1} or the {loc2}."
  const wasntAtMatch = text.match(/^(\w+) wasn't at the (\w+) or the (\w+)\.$/);
  if (wasntAtMatch) {
    const [, person, loc1, loc2] = wasntAtMatch;
    if (entities.people.includes(person)) {
      constraints.push({
        type: 'person_not_at_locations',
        check: (state) => {
          const loc = state.personToLocation[person];
          return loc === null || (loc !== loc1 && loc !== loc2);
        },
      });
    }
  }

  // Direct negative: "{person} did not have the {object}."
  const didNotHaveMatch = text.match(/^(\w+) did not have the (\w+)\.$/);
  if (didNotHaveMatch) {
    const [, person, object] = didNotHaveMatch;
    if (entities.people.includes(person) && entities.objects.includes(object)) {
      constraints.push({
        type: 'person_not_has_object',
        check: (state) => {
          const obj = state.personToObject[person];
          return obj === null || obj !== object;
        },
      });
    }
  }

  // Direct negative: "{person} wasn't seen at {time}."
  const wasntSeenMatch = text.match(/^(\w+) wasn't seen at ([\d:]+ [AP]M)\.$/);
  if (wasntSeenMatch) {
    const [, person, time] = wasntSeenMatch;
    if (entities.people.includes(person) && entities.times.includes(time)) {
      constraints.push({
        type: 'person_not_at_time',
        check: (state) => {
          const t = state.personToTime[person];
          return t === null || t !== time;
        },
      });
    }
  }

  // Relational: "{person1} arrived earlier than {person2}."
  const earlierMatch = text.match(/^(\w+) arrived earlier than (\w+)\.$/);
  if (earlierMatch) {
    const [, p1, p2] = earlierMatch;
    if (entities.people.includes(p1) && entities.people.includes(p2)) {
      constraints.push({
        type: 'person_earlier_than',
        check: (state) => {
          const t1 = state.personToTime[p1];
          const t2 = state.personToTime[p2];
          if (t1 === null || t2 === null) return true;
          return entities.times.indexOf(t1) < entities.times.indexOf(t2);
        },
      });
    }
  }

  // Relational: "{person1} arrived later than {person2}."
  const laterMatch = text.match(/^(\w+) arrived later than (\w+)\.$/);
  if (laterMatch) {
    const [, p1, p2] = laterMatch;
    if (entities.people.includes(p1) && entities.people.includes(p2)) {
      constraints.push({
        type: 'person_later_than',
        check: (state) => {
          const t1 = state.personToTime[p1];
          const t2 = state.personToTime[p2];
          if (t1 === null || t2 === null) return true;
          return entities.times.indexOf(t1) > entities.times.indexOf(t2);
        },
      });
    }
  }

  return constraints;
}

// Check if a solution satisfies all constraints
export function checkSolutionAgainstClues(
  solution: AlibiSolution,
  clues: AlibiClue[],
  entities: SolverEntities
): boolean {
  const state: SolverState = {
    personToLocation: { ...solution.personToLocation },
    personToTime: { ...solution.personToTime },
    personToObject: { ...solution.personToObject },
    locationToPerson: {},
    timeToPerson: {},
    objectToPerson: {},
    ruledOut: {
      personLocation: new Set(),
      personTime: new Set(),
      personObject: new Set(),
    },
  };

  // Build reverse mappings
  for (const [person, loc] of Object.entries(solution.personToLocation)) {
    state.locationToPerson[loc] = person;
  }
  for (const [person, time] of Object.entries(solution.personToTime)) {
    state.timeToPerson[time] = person;
  }
  for (const [person, obj] of Object.entries(solution.personToObject)) {
    state.objectToPerson[obj] = person;
  }

  for (const clue of clues) {
    const constraints = parseClueToConstraints(clue, entities);
    for (const constraint of constraints) {
      if (!constraint.check(state, entities)) {
        return false;
      }
    }
  }

  return true;
}

// Count valid solutions given constraints (simplified brute force for 4x4x4)
export function countValidSolutions(
  clues: AlibiClue[],
  entities: SolverEntities
): number {
  const { people, locations, times, objects } = entities;
  let count = 0;

  // Generate all permutations of assignments
  const permute = <T>(arr: T[]): T[][] => {
    if (arr.length <= 1) return [arr];
    const result: T[][] = [];
    for (let i = 0; i < arr.length; i++) {
      const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
      for (const perm of permute(rest)) {
        result.push([arr[i], ...perm]);
      }
    }
    return result;
  };

  const locPerms = permute(locations);
  const timePerms = permute(times);
  const objPerms = permute(objects);

  for (const locPerm of locPerms) {
    for (const timePerm of timePerms) {
      for (const objPerm of objPerms) {
        const solution: AlibiSolution = {
          personToLocation: {},
          personToTime: {},
          personToObject: {},
        };

        people.forEach((person, i) => {
          solution.personToLocation[person] = locPerm[i];
          solution.personToTime[person] = timePerm[i];
          solution.personToObject[person] = objPerm[i];
        });

        if (checkSolutionAgainstClues(solution, clues, entities)) {
          count++;
          if (count > 1) return count; // Early exit for efficiency
        }
      }
    }
  }

  return count;
}
