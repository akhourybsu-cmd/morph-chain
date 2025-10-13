/**
 * Dictionary Manifest Management
 * Handles versioning and validation for the Modern U.S. English Core Dictionary
 */

export interface DictionaryManifest {
  versions: {
    "4L": string;
    "5L": string;
    "6L": string;
  };
  updated: string;
  description: string;
  policy: string;
  totalPuzzles: {
    "4L": number;
    "5L": number;
    "6L": number;
  };
  transformationRules: {
    "4L": string;
    "5L": string;
    "6L": string;
  };
  validationCriteria: {
    minDistance: number;
    minPathCount: number;
    avgBranchingRange: [number, number];
  };
}

/**
 * Current dictionary manifest
 */
export const DICTIONARY_MANIFEST: DictionaryManifest = {
  versions: {
    "4L": "v1.2-core4L-notheme",
    "5L": "v1.2-core5L-notheme",
    "6L": "v1.2-core6L-notheme"
  },
  updated: "2025-10-13T00:00:00Z",
  description: "Morph Games Modern U.S. English Core Dictionary",
  policy: "Modern U.S. English only - excludes proper nouns, abbreviations, slang, archaic/dialectal words, and non-U.S. spellings",
  totalPuzzles: {
    "4L": 50,
    "5L": 50,
    "6L": 50
  },
  transformationRules: {
    "4L": "Change exactly 1 letter per move (Δ=1)",
    "5L": "First move Δ≤2, subsequent moves Δ=1",
    "6L": "Up to 2 letters change per move (Δ≤2)"
  },
  validationCriteria: {
    minDistance: 3,
    minPathCount: 10,
    avgBranchingRange: [2.5, 4.5]
  }
};

/**
 * Check if a word complies with Modern U.S. English policy
 */
export const isModernUSEnglish = (word: string): boolean => {
  // Basic validation - in production, this would check against the full dictionary
  const upper = word.toUpperCase();
  
  // Must be alphabetic
  if (!/^[A-Z]+$/.test(upper)) {
    return false;
  }
  
  // Check for basic patterns that indicate non-modern words
  // (This is simplified - full validation would use the complete word list)
  
  return true;
};

/**
 * Get the dictionary version for a given word length
 */
export const getDictionaryVersion = (wordLength: 4 | 5 | 6): string => {
  const key = `${wordLength}L` as "4L" | "5L" | "6L";
  return DICTIONARY_MANIFEST.versions[key];
};

/**
 * Get transformation rules for a given word length
 */
export const getTransformationRules = (wordLength: 4 | 5 | 6): string => {
  const key = `${wordLength}L` as "4L" | "5L" | "6L";
  return DICTIONARY_MANIFEST.transformationRules[key];
};

/**
 * Validate puzzle data against manifest criteria
 */
export const validatePuzzleAgainstManifest = (
  minDistance: number,
  pathCount: number,
  avgBranching: number
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const { validationCriteria } = DICTIONARY_MANIFEST;
  
  if (minDistance < validationCriteria.minDistance) {
    errors.push(`Minimum distance ${minDistance} is below required ${validationCriteria.minDistance}`);
  }
  
  if (pathCount < validationCriteria.minPathCount) {
    errors.push(`Path count ${pathCount} is below required ${validationCriteria.minPathCount}`);
  }
  
  const [minBranch, maxBranch] = validationCriteria.avgBranchingRange;
  if (avgBranching < minBranch || avgBranching > maxBranch) {
    errors.push(`Average branching ${avgBranching} is outside required range [${minBranch}, ${maxBranch}]`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};
