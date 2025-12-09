// Configuration constants for MORPH GRID balanced generation

export const VOWEL_RATIO_TARGET = 0.40;       // 40% vowels in generation
export const MIN_VOWELS_GLOBAL = 6;           // Minimum vowels after morphs (24%)
export const MAX_VOWELS_GLOBAL = 14;          // Maximum vowels after morphs (56%)
export const MAX_VOWEL_RUN = 2;               // No 3+ consecutive vowels
export const SUPPORT_LETTERS = ['E', 'A', 'S', 'T', 'R', 'N', 'L', 'I'];
export const HARD_CLUSTER = ['Q', 'Z', 'X', 'J', 'V'];
export const MAX_HARD_CLUSTER_IN_3x3 = 3;     // Max hard consonants in a 3x3 block
export const MAX_HARD_CLUSTER_GLOBAL = 3;     // Max hard consonants in entire grid

// Letter occurrence limits to prevent too many uncommon letters
export const LETTER_LIMITS: Record<string, number> = {
  // Rare letters - at most 1 per grid
  'Q': 1, 'X': 1, 'Z': 1, 'J': 1,
  // Uncommon letters - at most 2 per grid
  'K': 2, 'V': 2, 'W': 2, 'Y': 2, 'F': 2,
};

// Weighted letter distribution for better gameplay
// Note: Rare letters (J, Q, X, Z) removed from main pool - added conditionally
export const LETTER_WEIGHTS = {
  vowels: ['A', 'E', 'E', 'E', 'I', 'I', 'O', 'O', 'U'], // E is most common
  consonants: [
    // Tier 1: Very common (3x each)
    'R', 'R', 'R', 'S', 'S', 'S', 'T', 'T', 'T', 'N', 'N', 'N',
    // Tier 2: Common (2x each)
    'L', 'L', 'D', 'D', 'C', 'C', 'M', 'M', 'P', 'P', 'H', 'H',
    'G', 'G', 'B', 'B',
    // Tier 3: Less common (1x each) - still in pool but limited by LETTER_LIMITS
    'F', 'W', 'Y', 'K', 'V'
    // Tier 4: Rare (J, Q, X, Z) - NOT in pool, added with 10% chance per grid
  ]
};

export const RARE_LETTERS = ['J', 'Q', 'X', 'Z'];
export const RARE_LETTER_CHANCE = 0.10; // 10% chance to add one rare letter

export const VOWELS = ['A', 'E', 'I', 'O', 'U'];
export const GRID_SIZE = 5;
export const MAX_GENERATION_RETRIES = 200;
