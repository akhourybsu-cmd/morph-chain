// MEASURED - Clue Templates
// Auto-generates player-facing clues from structured data

export interface ClueData {
  entityName: string;
  propertyType: string;
  value: number;
  unit: string;
  roundingNote: string;
}

export interface GeneratedClue {
  clueText: string;
  revealBlurb: string;
  title: string;
}

// Property type to human-readable description
const PROPERTY_DESCRIPTIONS: Record<string, string> = {
  'elevation': 'elevation',
  'height': 'height',
  'area': 'area',
  'length': 'length',
  'distance': 'distance',
  'diameter': 'diameter',
  'radius': 'radius',
  'depth': 'depth',
  'mass': 'mass',
  'weight': 'weight',
  'temperature': 'melting point',
  'orbital_period': 'orbital period',
  'bone_count': 'number of bones',
  'teeth_count': 'number of teeth',
  'population': 'population',
  'year': 'year',
  'duration': 'duration',
};

// Unit formatting
const UNIT_FORMATS: Record<string, string> = {
  'meters': 'meters',
  'm': 'meters',
  'kilometers': 'kilometers',
  'km': 'kilometers',
  'km²': 'square kilometers',
  'square_km': 'square kilometers',
  'feet': 'feet',
  'ft': 'feet',
  'miles': 'miles',
  'mi': 'miles',
  'kg': 'kilograms',
  'kilograms': 'kilograms',
  'celsius': 'degrees Celsius',
  '°C': 'degrees Celsius',
  'days': 'Earth days',
  'years': 'Earth years',
  'count': '',
};

/**
 * Generate rounding note based on value magnitude
 */
export function generateRoundingNote(value: number): string {
  if (value >= 10000) return 'rounded to the nearest 100';
  if (value >= 1000) return 'rounded to the nearest 10';
  if (value >= 100) return 'rounded to the nearest 5';
  if (value >= 10) return 'rounded to the nearest 1';
  return '';
}

/**
 * Apply rounding based on magnitude
 */
export function applyRounding(value: number): number {
  if (value >= 10000) return Math.round(value / 100) * 100;
  if (value >= 1000) return Math.round(value / 10) * 10;
  if (value >= 100) return Math.round(value / 5) * 5;
  return Math.round(value);
}

/**
 * Format unit for display
 */
function formatUnit(unit: string): string {
  return UNIT_FORMATS[unit] || unit;
}

/**
 * Get property description
 */
function getPropertyDescription(propertyType: string): string {
  return PROPERTY_DESCRIPTIONS[propertyType] || propertyType;
}

/**
 * Generate clue text and reveal blurb from structured data
 */
export function generateClue(data: ClueData): GeneratedClue {
  const propertyDesc = getPropertyDescription(data.propertyType);
  const unitFormatted = formatUnit(data.unit);
  const roundingNote = data.roundingNote || generateRoundingNote(data.value);

  // Generate title (short identifier)
  const title = `${data.entityName} ${propertyDesc}`;

  // Generate clue text
  let clueText: string;
  if (unitFormatted && roundingNote) {
    clueText = `The ${propertyDesc} of ${data.entityName} in ${unitFormatted}, ${roundingNote}.`;
  } else if (unitFormatted) {
    clueText = `The ${propertyDesc} of ${data.entityName} in ${unitFormatted}.`;
  } else if (roundingNote) {
    clueText = `The ${propertyDesc} of ${data.entityName}, ${roundingNote}.`;
  } else {
    clueText = `The ${propertyDesc} of ${data.entityName}.`;
  }

  // Generate reveal blurb
  const revealBlurb = unitFormatted
    ? `${data.entityName} has ${propertyDesc === 'number of bones' || propertyDesc === 'number of teeth' ? '' : 'a '}${propertyDesc} of ${data.value.toLocaleString()} ${unitFormatted}.`
    : `${data.entityName} has ${propertyDesc === 'number of bones' || propertyDesc === 'number of teeth' ? '' : 'a '}${propertyDesc} of ${data.value.toLocaleString()}.`;

  return {
    clueText,
    revealBlurb,
    title
  };
}

/**
 * Validate that a clue is properly formed
 */
export function validateClue(clue: GeneratedClue): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!clue.clueText || clue.clueText.length < 10) {
    errors.push('Clue text is too short');
  }

  if (clue.clueText.length > 200) {
    errors.push('Clue text is too long');
  }

  if (!clue.revealBlurb || clue.revealBlurb.length < 10) {
    errors.push('Reveal blurb is too short');
  }

  if (!clue.title || clue.title.length < 3) {
    errors.push('Title is too short');
  }

  // Check for placeholder text
  if (clue.clueText.includes('undefined') || clue.clueText.includes('null')) {
    errors.push('Clue contains placeholder text');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Detect sanity flags for a candidate
 */
export function detectSanityFlags(
  value: number,
  rawValue: number,
  propertyType: string,
  hasReferences: boolean
): string[] {
  const flags: string[] = [];

  // Large value check
  if (value > 100000) {
    flags.push('large_value');
  }

  // Small value check
  if (value < 10) {
    flags.push('small_value');
  }

  // Missing reference
  if (!hasReferences) {
    flags.push('missing_reference');
  }

  // Significant rounding (more than 5% change)
  const roundingError = Math.abs(value - rawValue) / rawValue;
  if (roundingError > 0.05) {
    flags.push('estimated');
  }

  return flags;
}

/**
 * Get category from property type and entity type
 */
export function inferCategory(propertyType: string, entityType?: string): string {
  // Property-based inference
  const propertyCategories: Record<string, string> = {
    'elevation': 'geography',
    'height': 'geography',
    'area': 'geography',
    'length': 'geography',
    'depth': 'geography',
    'distance': 'astronomy',
    'diameter': 'astronomy',
    'radius': 'astronomy',
    'orbital_period': 'astronomy',
    'mass': 'science',
    'temperature': 'science',
    'bone_count': 'anatomy',
    'teeth_count': 'anatomy',
    'population': 'culture',
    'year': 'history',
  };

  return propertyCategories[propertyType] || 'science';
}

/**
 * Convert Wikidata property ID to property type
 */
export function wikidataPropertyToType(propertyId: string): string {
  const propertyMap: Record<string, string> = {
    'P2044': 'elevation',
    'P2048': 'height',
    'P2046': 'area',
    'P2043': 'length',
    'P4511': 'depth',
    'P2120': 'radius',
    'P2386': 'diameter',
    'P2146': 'orbital_period',
    'P2067': 'mass',
    'P2101': 'temperature',
    'P1174': 'bone_count',
  };

  return propertyMap[propertyId] || 'unknown';
}
