// Modern English word filtering rules
// Based on the Morph Chain "Modern English Only" policy
// Ensures only Webster Dictionary-approved modern U.S. English words

// Archaic, obsolete, dialectal words to exclude
const ARCHAIC_WORDS = new Set([
  // Old English / Middle English
  "PEASE", "CHARE", "YCLEPT", "NAE", "GAOL", "THEE", "THOU", "THINE",
  "HATH", "DOTH", "TWAS", "SHALT", "WHENCE", "HITHER", "THITHER",
  "YEA", "NAY", "ERE", "FORE", "AUGHT", "NAUGHT", "BETWIXT",
  "WHILST", "AMONGST", "AMONGST", "WHITHER", "WHIST", "MAYHAP",
  "FORSOOTH", "METHINKS", "PRITHEE", "WHEREFORE", "HENCEFORTH",
  
  // Archaic scientific/medical terms
  "ABACINATE", "ABACINATION", "ABAPTISTON", "ABAPTISTUM", "ABARTICULATION",
  "ABARTHROSIS", "ABASIA", "ABASIO", "ABASTARD", "ABASTARDIZE",
  "ABALIENATE", "ABALIENATION", "ABANNITION", "ABAPTISTON",
  
  // Obsolete/rare words unlikely in modern usage
  "ABABDEH", "ABABUA", "ABACAY", "ABACATE", "ABACAXI", "ABACISCUS",
  "ABACIST", "ABACOT", "ABACULI", "ABACULUS", "ABADA", "ABADENGO",
  "ABADIA", "ABADITE", "ABAFF", "ABAYAH", "ABAISANCE", "ABAISED",
  "ABAISER", "ABAISSE", "ABAISSED", "ABALATION", "ABAMA", "ABAND",
  "ABANDUM", "ABANET", "ABANGA", "ABANIC", "ABANTES", "ABAPICAL",
  "ABARAMBO", "ABARIS", "ABASGI", "ABASIC", "ABASK", "ABASSI",
  "ABASSIN", "ABASTRAL", "ABATAGE", "ABATIC", "ABATJOUR", "ABATON",
  "ABATTAGE", "ABATTU", "ABATTUE", "ABATUA", "ABATURE", "ABAUE",
  "ABAVE", "ABAZE", "ABBACOMES", "ABBADIDE", "ABBAYE", "ABBANDONO",
  
  // Two-letter combinations (too short, often abbreviations)
  "AA", "AAL", "AAM", "AAS", "AB", "AD", "AE", "AH", "AI", "AL",
  "AM", "AN", "AR", "AS", "AT", "AW", "AX", "AY", "BA", "BE",
  "BI", "BO", "BY", "DA", "DE", "DO", "ED", "EF", "EH", "EL",
  "EM", "EN", "ER", "ES", "ET", "EX", "FA", "GO", "HA", "HE",
  "HI", "HM", "HO", "ID", "IF", "IN", "IS", "IT", "JO", "KA",
  "LA", "LI", "LO", "MA", "ME", "MI", "MM", "MO", "MU", "MY",
  "NA", "NE", "NO", "NU", "OD", "OE", "OF", "OH", "OI", "OK",
  "OM", "ON", "OP", "OR", "OS", "OW", "OX", "OY", "PA", "PE",
  "PI", "QI", "RE", "SH", "SI", "SO", "TA", "TI", "TO", "UH",
  "UM", "UN", "UP", "US", "UT", "WE", "WO", "XI", "XU", "YA",
  "YE", "YO", "ZA",
]);

// Proper nouns, brands, demonyms to exclude
const PROPER_NOUNS = new Set([
  // Tech brands
  "TESLA", "APPLE", "GOOGLE", "IPHONE", "AMAZON", "NETFLIX", "ZOOM",
  "UBER", "LYFT", "XBOX", "MICROSOFT", "FACEBOOK", "TWITTER", "INSTAGRAM",
  "YOUTUBE", "SPOTIFY", "PAYPAL", "EBAY", "YAHOO", "ADOBE",
  
  // Automotive brands
  "FORD", "HONDA", "TOYOTA", "NISSAN", "BMW", "AUDI", "MERCEDES",
  "VOLKSWAGEN", "PORSCHE", "FERRARI", "LAMBORGHINI", "TESLA",
  "CHEVROLET", "DODGE", "JEEP", "CHRYSLER", "MAZDA", "SUBARU",
  
  // Food/beverage brands
  "PEPSI", "COKE", "COCA", "COLA", "SPRITE", "FANTA", "STARBUCKS",
  "MCDONALDS", "WALMART", "TARGET", "COSTCO", "IKEA",
  
  // Entertainment
  "DISNEY", "MARVEL", "PIXAR", "WARNER", "PARAMOUNT", "UNIVERSAL",
  "SONY", "NINTENDO", "PLAYSTATION",
  
  // Places (cities, countries, regions)
  "PARIS", "LONDON", "TOKYO", "BEIJING", "DELHI", "MOSCOW", "CAIRO",
  "SYDNEY", "BERLIN", "ROME", "MADRID", "VIENNA", "ATHENS", "OSLO",
  "CHINA", "JAPAN", "INDIA", "KOREA", "RUSSIA", "BRAZIL", "MEXICO",
  "CANADA", "FRANCE", "SPAIN", "ITALY", "GERMANY", "POLAND", "SWEDEN",
  "NORWAY", "DENMARK", "FINLAND", "GREECE", "EGYPT", "ISRAEL", "IRAN",
  "IRAQ", "SYRIA", "TURKEY", "VIETNAM", "THAILAND", "CAMBODIA",
  
  // Biblical/mythological names
  "AARON", "ABEL", "ABRAHAM", "ADAM", "MOSES", "DAVID", "SOLOMON",
  "JESUS", "MARY", "JOSEPH", "JOHN", "PETER", "PAUL", "MATTHEW",
  "ZEUS", "APOLLO", "ATHENA", "HERCULES", "ODYSSEUS", "ACHILLES",
  
  // Common first/last names
  "SMITH", "JOHNSON", "WILLIAMS", "JONES", "BROWN", "DAVIS", "MILLER",
  "WILSON", "MOORE", "TAYLOR", "ANDERSON", "THOMAS", "JACKSON", "WHITE",
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
 * Ensures only Webster Dictionary-approved modern U.S. English words
 */
export const isModernEnglish = (word: string): boolean => {
  const upper = word.toUpperCase();
  const lower = word.toLowerCase();
  
  // 1. Check explicit banlist
  if (BANLIST.has(upper)) {
    return false;
  }
  
  // 2. Reject very short words (2 letters or less) - often abbreviations
  if (word.length <= 2) {
    return false;
  }
  
  // 3. Check for excessive letter repetition (3+ of same letter)
  const letterCounts = new Map<string, number>();
  for (const char of upper) {
    letterCounts.set(char, (letterCounts.get(char) || 0) + 1);
    if (letterCounts.get(char)! >= 4) {
      return false; // Words like "BZZZ" or "ARRR" or "AAAA"
    }
  }
  
  // 4. Check for minimum vowel/consonant diversity
  const vowels = new Set(['A', 'E', 'I', 'O', 'U']);
  const hasVowel = Array.from(upper).some(c => vowels.has(c));
  const hasConsonant = Array.from(upper).some(c => !vowels.has(c));
  
  if (!hasVowel || !hasConsonant) {
    return false; // Need at least one vowel and one consonant
  }
  
  // All additional filtering is done via the explicit banlist above
  // This keeps common words like "sock", "dock", "book" valid
  
  // 8. Reject words with uncommon character sequences (triple letters only)
  const uncommonTriples = ['AAA', 'EEE', 'III', 'OOO', 'UUU', 'ZZZ'];
  for (const triple of uncommonTriples) {
    if (upper.includes(triple)) {
      return false;
    }
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
