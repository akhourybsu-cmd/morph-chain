import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Wikidata property configurations for different categories
const PROPERTY_CONFIGS = [
  {
    category: "Geography",
    property: "P2044",
    propertyLabel: "elevation",
    entityType: "Q8502", // mountain
    entityLabel: "mountain",
    unit: "meters",
    minValue: 100,
    maxValue: 9000,
    roundTo: 10,
  },
  {
    category: "Geography",
    property: "P2046",
    propertyLabel: "area",
    entityType: "Q515", // city
    entityLabel: "city",
    unit: "square kilometers",
    minValue: 10,
    maxValue: 100000,
    roundTo: 1,
  },
  {
    category: "Astronomy",
    property: "P2120",
    propertyLabel: "radius",
    entityType: "Q3504248", // planet
    entityLabel: "planet",
    unit: "kilometers",
    minValue: 1000,
    maxValue: 100000,
    roundTo: 100,
  },
  {
    category: "Science",
    property: "P2101",
    propertyLabel: "melting point",
    entityType: "Q11344", // chemical element
    entityLabel: "element",
    unit: "degrees Celsius",
    minValue: -300,
    maxValue: 4000,
    roundTo: 1,
  },
  {
    category: "Culture",
    property: "P1619",
    propertyLabel: "year opened",
    entityType: "Q33506", // museum
    entityLabel: "museum",
    unit: "year",
    minValue: 1500,
    maxValue: 2025,
    roundTo: 1,
  },
];

// Apply rounding based on magnitude
function applyRounding(value: number, roundTo: number): number {
  return Math.round(value / roundTo) * roundTo;
}

// Get rounding description for clue
function getRoundingNote(roundTo: number): string {
  if (roundTo === 1) return "";
  if (roundTo === 5) return ", rounded to the nearest 5";
  if (roundTo === 10) return ", rounded to the nearest 10";
  if (roundTo === 100) return ", rounded to the nearest 100";
  return `, rounded to the nearest ${roundTo}`;
}

// Generate clue text from entity and property
function generateClueText(
  entityLabel: string,
  propertyLabel: string,
  unit: string,
  roundTo: number
): string {
  const roundingNote = getRoundingNote(roundTo);
  return `The ${propertyLabel} of ${entityLabel} in ${unit}${roundingNote}.`;
}

// Generate reveal blurb
function generateRevealBlurb(
  entityLabel: string,
  propertyLabel: string,
  value: number,
  unit: string
): string {
  return `${entityLabel} has a ${propertyLabel} of ${value.toLocaleString()} ${unit}.`;
}

// Calculate confidence score
function calculateConfidence(
  referenceCount: number,
  valueInRange: boolean,
  cleanConversion: boolean,
  sanityFlags: string[]
): number {
  let score = 0;
  
  // Reference bonus
  if (referenceCount >= 2) score += 0.4;
  else if (referenceCount >= 1) score += 0.2;
  
  // Value range bonus
  if (valueInRange) score += 0.2;
  
  // Clean conversion bonus
  if (cleanConversion) score += 0.2;
  
  // Stability bonus (assume stable for structured data)
  score += 0.1;
  
  // No sanity flags bonus
  if (sanityFlags.length === 0) score += 0.1;
  
  // Apply penalties
  if (sanityFlags.includes("ambiguous_definition")) score -= 0.3;
  if (sanityFlags.includes("missing_reference")) score -= 0.2;
  if (sanityFlags.includes("unit_mismatch")) score -= 0.2;
  if (sanityFlags.includes("estimated")) score -= 0.1;
  
  return Math.max(0, Math.min(1, score));
}

// Detect sanity flags
function detectSanityFlags(value: number, minValue: number, maxValue: number): string[] {
  const flags: string[] = [];
  
  if (value > 1000000) flags.push("large_value");
  if (value < 10 && value > 0) flags.push("small_value");
  if (value < minValue || value > maxValue) flags.push("out_of_range");
  if (value <= 0) flags.push("non_positive");
  
  return flags;
}

// Query Wikidata using SPARQL
async function queryWikidata(config: typeof PROPERTY_CONFIGS[0], limit: number = 50): Promise<any[]> {
  const sparql = `
    SELECT ?item ?itemLabel ?value WHERE {
      ?item wdt:P31 wd:${config.entityType} .
      ?item wdt:${config.property} ?value .
      FILTER(?value >= ${config.minValue} && ?value <= ${config.maxValue})
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
    LIMIT ${limit}
  `;
  
  const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}`;
  
  const response = await fetch(url, {
    headers: {
      "Accept": "application/json",
      "User-Agent": "MeasuredGame/1.0 (contact@morphgames.com)",
    },
  });
  
  if (!response.ok) {
    console.error(`Wikidata query failed: ${response.status}`);
    return [];
  }
  
  const data = await response.json();
  return data.results?.bindings || [];
}

// Process Wikidata results into candidates
function processResults(
  results: any[],
  config: typeof PROPERTY_CONFIGS[0]
): any[] {
  const candidates = [];
  
  for (const result of results) {
    const entityId = result.item?.value?.split("/").pop() || "";
    const entityLabel = result.itemLabel?.value || "";
    const rawValue = parseFloat(result.value?.value || "0");
    
    if (!entityLabel || entityLabel.startsWith("Q")) continue;
    if (isNaN(rawValue)) continue;
    
    const normalizedValue = applyRounding(rawValue, config.roundTo);
    const sanityFlags = detectSanityFlags(rawValue, config.minValue, config.maxValue);
    
    // Skip invalid values
    if (normalizedValue <= 0 || sanityFlags.includes("non_positive")) continue;
    
    const confidence = calculateConfidence(
      1, // Wikidata always has at least 1 reference
      !sanityFlags.includes("out_of_range"),
      true,
      sanityFlags
    );
    
    const status = confidence >= 0.85 ? "needs_review" : "new";
    
    candidates.push({
      source_name: "wikidata",
      source_entity_id: entityId,
      source_property_id: config.property,
      raw_value: rawValue,
      raw_unit: config.unit,
      normalized_value_int: normalizedValue,
      unit_label: config.unit,
      category: config.category,
      title: entityLabel,
      clue_text: generateClueText(entityLabel, config.propertyLabel, config.unit, config.roundTo),
      reveal_blurb: generateRevealBlurb(entityLabel, config.propertyLabel, normalizedValue, config.unit),
      sources: [{ url: `https://www.wikidata.org/wiki/${entityId}`, name: "Wikidata" }],
      reference_count: 1,
      confidence_score: confidence,
      sanity_flags: sanityFlags,
      status,
    });
  }
  
  return candidates;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify admin access
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();
    
    if (!roleData || roleData.role !== "admin") {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Parse request body for optional config
    let categories: string[] = [];
    let limitPerCategory = 20;
    
    try {
      const body = await req.json();
      categories = body.categories || [];
      limitPerCategory = body.limit || 20;
    } catch {
      // Use defaults
    }
    
    // Filter configs by requested categories
    const configs = categories.length > 0
      ? PROPERTY_CONFIGS.filter(c => categories.includes(c.category))
      : PROPERTY_CONFIGS;
    
    console.log(`Ingesting facts from ${configs.length} property configs...`);
    
    let totalInserted = 0;
    let totalSkipped = 0;
    const errors: string[] = [];
    
    for (const config of configs) {
      try {
        console.log(`Querying Wikidata for ${config.category} - ${config.propertyLabel}...`);
        
        const results = await queryWikidata(config, limitPerCategory);
        console.log(`Got ${results.length} results from Wikidata`);
        
        const candidates = processResults(results, config);
        console.log(`Processed ${candidates.length} valid candidates`);
        
        if (candidates.length === 0) continue;
        
        // Check for existing candidates to avoid duplicates
        const entityIds = candidates.map(c => c.source_entity_id);
        const { data: existing } = await supabase
          .from("measured_fact_candidates")
          .select("source_entity_id, source_property_id")
          .eq("source_name", "wikidata")
          .eq("source_property_id", config.property)
          .in("source_entity_id", entityIds);
        
        const existingKeys = new Set(
          (existing || []).map(e => `${e.source_entity_id}-${e.source_property_id}`)
        );
        
        const newCandidates = candidates.filter(
          c => !existingKeys.has(`${c.source_entity_id}-${c.source_property_id}`)
        );
        
        if (newCandidates.length === 0) {
          totalSkipped += candidates.length;
          continue;
        }
        
        // Insert new candidates
        const { error: insertError } = await supabase
          .from("measured_fact_candidates")
          .insert(newCandidates);
        
        if (insertError) {
          errors.push(`${config.category}: ${insertError.message}`);
          console.error(`Insert error for ${config.category}:`, insertError);
        } else {
          totalInserted += newCandidates.length;
          totalSkipped += candidates.length - newCandidates.length;
        }
        
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        errors.push(`${config.category}: ${message}`);
        console.error(`Error processing ${config.category}:`, err);
      }
    }
    
    // Log the ingestion run
    await supabase.from("measured_audit_log").insert({
      admin_user_id: user.id,
      action: "ingest_run",
      entity_type: "candidate",
      details: {
        categories: configs.map(c => c.category),
        inserted: totalInserted,
        skipped: totalSkipped,
        errors,
      },
    });
    
    return new Response(
      JSON.stringify({
        success: true,
        inserted: totalInserted,
        skipped: totalSkipped,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
    
  } catch (err) {
    console.error("Ingestion error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
