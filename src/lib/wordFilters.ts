// Modern English word filtering rules
// Based on the Morph Chain "Modern English Only" policy

// Archaic, obsolete, dialectal words to exclude
const ARCHAIC_WORDS = new Set([
  "PEASE", "CHARE", "YCLEPT", "NAE", "GAOL", "THEE", "THOU", "THINE",
  "HATH", "DOTH", "TWAS", "SHALT", "WHENCE", "HITHER", "THITHER",
  "YEA", "NAY", "ERE", "FORE", "AUGHT", "NAUGHT", "BETWIXT",
]);

// Proper nouns, brands, demonyms to exclude
const PROPER_NOUNS = new Set([
  "TESLA", "PARIS", "LONDON", "APPLE", "GOOGLE", "IPHONE", "AMAZON",
  "NETFLIX", "ZOOM", "UBER", "LYFT", "BOEING", "FORD", "HONDA",
  "PEPSI", "COKE", "DISNEY", "XBOX", "CHINA", "JAPAN", "INDIA",
]);

// Texting/slang/internet speak to exclude
const SLANG_WORDS = new Set([
  "FOMO", "LOL", "OMG", "WTF", "BTW", "THX", "PLS", "YOLO",
  "SELFIE", "GONNA", "WANNA", "GOTTA", "DUNNO", "KINDA", "SORTA",
]);

// Over-technical or field-specific jargon
const TECHNICAL_JARGON = new Set([
  "ETHYLS", "BENZOL", "PHENOL", "ALKYL", "MOIETY", "INTARSIA",
  "SERIFS", "BEZIER", "CODEC", "MUTEX", "REGEX",
]);

// Profanity and inappropriate content (sample - expand as needed)
const PROFANITY = new Set([
  // Add explicit profanity here
]);

// Combined banlist
const BANLIST = new Set([
  ...ARCHAIC_WORDS,
  ...PROPER_NOUNS,
  ...SLANG_WORDS,
  ...TECHNICAL_JARGON,
  ...PROFANITY,
]);

/**
 * Check if a word passes modern English standards
 */
export const isModernEnglish = (word: string): boolean => {
  const upper = word.toUpperCase();
  
  // Check banlist
  if (BANLIST.has(upper)) {
    return false;
  }
  
  // Check for proper noun patterns (all caps in original list suggests proper noun)
  // This is a heuristic - may need refinement
  
  // Check for excessive letter repetition (3+ of same letter)
  const letterCounts = new Map<string, number>();
  for (const char of upper) {
    letterCounts.set(char, (letterCounts.get(char) || 0) + 1);
    if (letterCounts.get(char)! >= 3) {
      return false; // Words like "BZZZ" or "ARRR"
    }
  }
  
  // Check for minimum vowel/consonant diversity
  const vowels = new Set(['A', 'E', 'I', 'O', 'U']);
  const hasVowel = Array.from(upper).some(c => vowels.has(c));
  const hasConsonant = Array.from(upper).some(c => !vowels.has(c));
  
  if (!hasVowel || !hasConsonant) {
    return false; // Need at least one vowel and one consonant
  }
  
  return true;
};

/**
 * Filter a word set to only include modern English words
 */
export const filterModernEnglish = (words: Set<string>): Set<string> => {
  const filtered = new Set<string>();
  
  for (const word of words) {
    if (isModernEnglish(word)) {
      filtered.add(word);
    }
  }
  
  return filtered;
};

/**
 * Add a word to the banlist (for disputed words)
 */
export const addToBanlist = (word: string): void => {
  BANLIST.add(word.toUpperCase());
  // In a real implementation, this would persist to backend/storage
};

/**
 * Check if a word is in the banlist
 */
export const isBanned = (word: string): boolean => {
  return BANLIST.has(word.toUpperCase());
};
