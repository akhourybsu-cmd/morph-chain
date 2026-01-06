// MEASURED - Confidence Scoring System
// Calculates trust score for auto-ingested facts

export interface ConfidenceFactors {
  hasMultipleReferences: boolean;
  referenceCount: number;
  valueInExpectedRange: boolean;
  cleanUnitConversion: boolean;
  propertyIsStable: boolean;
  sanityFlags: string[];
}

export interface ConfidenceResult {
  score: number;
  breakdown: {
    factor: string;
    contribution: number;
    description: string;
  }[];
  status: 'needs_review' | 'blocked';
}

// Stable properties that rarely change
const STABLE_PROPERTIES = [
  'P2044', // elevation
  'P2046', // area
  'P2043', // length
  'P2120', // radius
  'P2067', // mass
  'P2101', // melting point
  'P1174', // bone count
];

// Expected value ranges by category
const EXPECTED_RANGES: Record<string, { min: number; max: number }> = {
  'elevation': { min: -500, max: 10000 },
  'area_km2': { min: 1, max: 20000000 },
  'distance_km': { min: 1, max: 500000000 },
  'diameter_km': { min: 1, max: 200000 },
  'mass_kg': { min: 1, max: 1e30 },
  'temperature_c': { min: -300, max: 10000 },
  'count': { min: 1, max: 1000 },
};

/**
 * Calculate confidence score for a fact candidate
 */
export function calculateConfidenceScore(factors: ConfidenceFactors): ConfidenceResult {
  const breakdown: ConfidenceResult['breakdown'] = [];
  let score = 0;

  // +0.4 for 2+ independent references
  if (factors.hasMultipleReferences && factors.referenceCount >= 2) {
    score += 0.4;
    breakdown.push({
      factor: 'Multiple References',
      contribution: 0.4,
      description: `${factors.referenceCount} independent sources`
    });
  } else if (factors.referenceCount === 1) {
    score += 0.2;
    breakdown.push({
      factor: 'Single Reference',
      contribution: 0.2,
      description: '1 source (partial credit)'
    });
  } else {
    breakdown.push({
      factor: 'No References',
      contribution: 0,
      description: 'Missing citations'
    });
  }

  // +0.2 for value in expected range
  if (factors.valueInExpectedRange) {
    score += 0.2;
    breakdown.push({
      factor: 'Value in Range',
      contribution: 0.2,
      description: 'Value falls within expected bounds'
    });
  } else {
    breakdown.push({
      factor: 'Unusual Value',
      contribution: 0,
      description: 'Value outside typical range'
    });
  }

  // +0.2 for clean unit conversion
  if (factors.cleanUnitConversion) {
    score += 0.2;
    breakdown.push({
      factor: 'Clean Conversion',
      contribution: 0.2,
      description: 'Unit conversion was straightforward'
    });
  } else {
    breakdown.push({
      factor: 'Complex Conversion',
      contribution: 0,
      description: 'Unit conversion may have precision loss'
    });
  }

  // +0.1 for stable property
  if (factors.propertyIsStable) {
    score += 0.1;
    breakdown.push({
      factor: 'Stable Property',
      contribution: 0.1,
      description: 'Property rarely changes over time'
    });
  } else {
    breakdown.push({
      factor: 'Variable Property',
      contribution: 0,
      description: 'Property may change'
    });
  }

  // +0.1 for no sanity flags
  if (factors.sanityFlags.length === 0) {
    score += 0.1;
    breakdown.push({
      factor: 'No Warnings',
      contribution: 0.1,
      description: 'No sanity flags triggered'
    });
  } else {
    // Apply penalties for each flag
    const penalties = calculatePenalties(factors.sanityFlags);
    score -= penalties.total;
    breakdown.push({
      factor: 'Sanity Penalties',
      contribution: -penalties.total,
      description: penalties.description
    });
  }

  // Clamp score between 0 and 1
  score = Math.max(0, Math.min(1, score));

  return {
    score: Math.round(score * 100) / 100,
    breakdown,
    status: score >= 0.85 ? 'needs_review' : 'blocked'
  };
}

/**
 * Calculate penalties for sanity flags
 */
function calculatePenalties(flags: string[]): { total: number; description: string } {
  const penaltyMap: Record<string, { value: number; desc: string }> = {
    'ambiguous_definition': { value: 0.3, desc: 'Ambiguous definition' },
    'missing_reference': { value: 0.2, desc: 'Missing reference' },
    'unit_mismatch': { value: 0.2, desc: 'Unit mismatch' },
    'estimated': { value: 0.15, desc: 'Value is estimated' },
    'large_value': { value: 0.1, desc: 'Very large value' },
    'small_value': { value: 0.1, desc: 'Very small value' },
    'controversial': { value: 0.3, desc: 'Potentially controversial' },
  };

  let total = 0;
  const descriptions: string[] = [];

  for (const flag of flags) {
    const penalty = penaltyMap[flag];
    if (penalty) {
      total += penalty.value;
      descriptions.push(penalty.desc);
    }
  }

  return {
    total: Math.min(total, 0.5), // Cap total penalty at 0.5
    description: descriptions.join(', ') || 'Unknown flags'
  };
}

/**
 * Check if a property is considered stable
 */
export function isStableProperty(propertyId: string): boolean {
  return STABLE_PROPERTIES.includes(propertyId);
}

/**
 * Check if a value is within expected range for a category
 */
export function isValueInExpectedRange(
  value: number,
  rangeKey: string
): boolean {
  const range = EXPECTED_RANGES[rangeKey];
  if (!range) return true; // If no range defined, assume OK
  return value >= range.min && value <= range.max;
}

/**
 * Get confidence badge color for UI display
 */
export function getConfidenceColor(score: number): string {
  if (score >= 0.85) return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
  if (score >= 0.7) return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
  if (score >= 0.5) return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30';
  return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
}

/**
 * Format confidence score as percentage
 */
export function formatConfidence(score: number): string {
  return `${Math.round(score * 100)}%`;
}
