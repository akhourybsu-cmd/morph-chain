// Configuration constants for MORPH GRID balanced generation

export const VOWEL_RATIO_TARGET = 0.40;       // 40% vowels in generation
export const MIN_VOWELS_GLOBAL = 6;           // Minimum vowels after morphs (24%)
export const MAX_VOWELS_GLOBAL = 14;          // Maximum vowels after morphs (56%)
export const MAX_VOWEL_RUN = 2;               // No 3+ consecutive vowels
export const SUPPORT_LETTERS = ['E', 'A', 'S', 'T', 'R', 'N', 'L', 'I'];
export const HARD_CLUSTER = ['Q', 'Z', 'X', 'J', 'V'];
export const MAX_HARD_CLUSTER_IN_3x3 = 3;     // Max hard consonants in a 3x3 block

// Weighted letter distribution for better gameplay
export const LETTER_WEIGHTS = {
  vowels: ['A', 'E', 'E', 'E', 'I', 'I', 'O', 'O', 'U'], // E is most common
  consonants: [
    'R', 'R', 'R', 'S', 'S', 'S', 'T', 'T', 'T', 'N', 'N', 'N',
    'L', 'L', 'D', 'D', 'C', 'C', 'M', 'M', 'P', 'P', 'H', 'H',
    'G', 'G', 'B', 'B', 'F', 'W', 'Y', 'V', 'K', 'J', 'Q', 'X', 'Z'
  ]
};

export const VOWELS = ['A', 'E', 'I', 'O', 'U'];
export const GRID_SIZE = 5;
export const MAX_GENERATION_RETRIES = 200;
