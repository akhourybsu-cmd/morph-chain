import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Fact {
  id: string;
  title: string;
  clue_text: string;
  reveal_blurb: string;
  canonical_value_int: number;
  unit_label: string;
  category: string;
  last_used_date: string | null;
  times_used: number;
}

interface PuzzleSolution {
  A: number;
  B: number;
  C: number;
  D: number;
}

interface GeneratedPuzzle {
  tiles: number[];
  solution: PuzzleSolution;
  target: number;
  nearMissCount: number;
  isUnique: boolean;
}

interface GeneratorConfig {
  minTile: number;
  maxTile: number;
  tileCount: number;
  maxAttempts: number;
}

// Compute the equation result: (A × B) + C − D
function compute(A: number, B: number, C: number, D: number): number {
  return (A * B) + C - D;
}

// Get a random integer between min and max (inclusive)
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Shuffle an array using Fisher-Yates algorithm
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Find a valid solution (A, B, C, D) for a given target
function findSolution(target: number, config: GeneratorConfig): PuzzleSolution | null {
  const { minTile, maxTile, maxAttempts } = config;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const A = randomInt(minTile, maxTile);
    const B = randomInt(minTile, maxTile);
    const C = randomInt(minTile, maxTile);
    
    // Calculate D: D = (A*B) + C - target
    const D = (A * B) + C - target;
    
    // Validate D is within tile range
    if (D < minTile || D > maxTile) continue;
    
    // Avoid trivial solutions where tiles equal target
    if (A === target || B === target || C === target || D === target) continue;
    
    return { A, B, C, D };
  }
  
  return null;
}

// Generate decoy tiles that create near-misses
function generateDecoys(
  solution: PuzzleSolution,
  config: GeneratorConfig,
  count: number
): number[] {
  const { minTile, maxTile } = config;
  const solutionTiles = [solution.A, solution.B, solution.C, solution.D];
  const decoys: number[] = [];
  
  // Add "tempting" decoys - close to solution values
  const temptingDecoys = [
    solution.A + 1, solution.A - 1,
    solution.B + 1, solution.B - 1,
    solution.C + 1, solution.C - 1,
    solution.D + 1, solution.D - 1,
  ].filter(d => d >= minTile && d <= maxTile && !solutionTiles.includes(d));
  
  const shuffledTempting = shuffle(temptingDecoys);
  for (let i = 0; i < Math.min(3, shuffledTempting.length) && decoys.length < count; i++) {
    if (!decoys.includes(shuffledTempting[i])) {
      decoys.push(shuffledTempting[i]);
    }
  }
  
  // Fill remaining with random values
  let attempts = 0;
  while (decoys.length < count && attempts < 1000) {
    const d = randomInt(minTile, maxTile);
    if (!solutionTiles.includes(d) && !decoys.includes(d)) {
      decoys.push(d);
    }
    attempts++;
  }
  
  return decoys;
}

// Check if a tile set has a unique solution for the target
function checkUniqueness(tiles: number[], target: number): { exactCount: number; nearMissCount: number } {
  let exactCount = 0;
  let nearMissCount = 0;
  const threshold = Math.max(1, Math.round(target * 0.1));
  
  const n = tiles.length;
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (j === i) continue;
      for (let k = 0; k < n; k++) {
        if (k === i || k === j) continue;
        for (let l = 0; l < n; l++) {
          if (l === i || l === j || l === k) continue;
          
          const result = compute(tiles[i], tiles[j], tiles[k], tiles[l]);
          
          if (result === target) {
            exactCount++;
          } else if (Math.abs(result - target) <= threshold) {
            nearMissCount++;
          }
        }
      }
    }
  }
  
  return { exactCount, nearMissCount };
}

// Generate a puzzle with a unique solution
function generatePuzzle(target: number, config: Partial<GeneratorConfig> = {}): GeneratedPuzzle | null {
  const fullConfig: GeneratorConfig = {
    minTile: config.minTile ?? 1,
    maxTile: config.maxTile ?? 25,
    tileCount: config.tileCount ?? 10,
    maxAttempts: config.maxAttempts ?? 5000,
  };
  const decoyCount = fullConfig.tileCount - 4;
  
  for (let attempt = 0; attempt < 100; attempt++) {
    const solution = findSolution(target, fullConfig);
    
    if (!solution) continue;
    
    const solutionTiles = [solution.A, solution.B, solution.C, solution.D];
    const decoys = generateDecoys(solution, fullConfig, decoyCount);
    
    if (decoys.length < decoyCount) continue;
    
    const tiles = shuffle([...solutionTiles, ...decoys]);
    const { exactCount, nearMissCount } = checkUniqueness(tiles, target);
    
    // We want exactly 1 solution and at least 3 near-misses
    if (exactCount === 1 && nearMissCount >= 3) {
      return {
        tiles,
        solution,
        target,
        nearMissCount,
        isUnique: true,
      };
    }
  }
  
  return null;
}

// Get difficulty config based on day of week and target
function getDifficultyConfig(dayOfWeek: number, target: number): { difficulty: string; minTile: number; maxTile: number } {
  // 0 = Sunday, 1 = Monday, etc.
  if (dayOfWeek === 1 || dayOfWeek === 2) {
    // Mon-Tue: Easy
    return { difficulty: "easy", minTile: 1, maxTile: 20 };
  } else if (dayOfWeek === 3 || dayOfWeek === 4) {
    // Wed-Thu: Medium
    return { difficulty: "medium", minTile: 1, maxTile: 25 };
  } else if (dayOfWeek === 5 || dayOfWeek === 6) {
    // Fri-Sat: Medium-Hard
    return { difficulty: "medium-hard", minTile: 1, maxTile: target > 1000 ? 35 : 30 };
  } else {
    // Sunday: Showcase
    return { difficulty: "showcase", minTile: 1, maxTile: target > 5000 ? 50 : 35 };
  }
}

// Format date as YYYY-MM-DD
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

// Add days to a date
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
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
    
    // Parse request body
    let puzzleCount = 200;
    let startDateOverride: string | null = null;
    
    try {
      const body = await req.json();
      puzzleCount = body.count || 200;
      startDateOverride = body.startDate || null;
    } catch {
      // Use defaults
    }
    
    console.log(`Generating ${puzzleCount} puzzles...`);
    
    // Get the default puzzle template
    const { data: template } = await supabase
      .from("measured_puzzle_templates")
      .select("*")
      .eq("template_key", "default")
      .single();
    
    if (!template) {
      return new Response(JSON.stringify({ error: "No puzzle template found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Find the start date (first unfilled future date)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: existingPuzzles } = await supabase
      .from("measured_daily_puzzles")
      .select("puzzle_date")
      .gte("puzzle_date", formatDate(today))
      .order("puzzle_date", { ascending: false });
    
    const existingDates = new Set((existingPuzzles || []).map(p => p.puzzle_date));
    
    let startDate: Date;
    if (startDateOverride) {
      startDate = new Date(startDateOverride);
    } else {
      // Find first gap or next day after last puzzle
      startDate = today;
      while (existingDates.has(formatDate(startDate))) {
        startDate = addDays(startDate, 1);
      }
    }
    
    console.log(`Start date: ${formatDate(startDate)}`);
    
    // Get all verified facts from fact bank
    const { data: allFacts, error: factsError } = await supabase
      .from("measured_fact_bank")
      .select("*")
      .eq("status", "verified")
      .order("times_used", { ascending: true })
      .order("last_used_date", { ascending: true, nullsFirst: true });
    
    if (factsError) {
      throw new Error(`Failed to load facts: ${factsError.message}`);
    }
    
    // Also get high-confidence auto-ingested facts
    const { data: autoFacts } = await supabase
      .from("measured_fact_bank")
      .select("*")
      .eq("is_auto_ingested", true)
      .eq("status", "verified")
      .order("times_used", { ascending: true });
    
    const facts: Fact[] = [...(allFacts || []), ...(autoFacts || [])];
    
    // Remove duplicates
    const factMap = new Map<string, Fact>();
    for (const f of facts) {
      factMap.set(f.id, f);
    }
    const uniqueFacts = Array.from(factMap.values());
    
    console.log(`Found ${uniqueFacts.length} available facts`);
    
    if (uniqueFacts.length < puzzleCount) {
      return new Response(JSON.stringify({
        error: "Insufficient facts",
        available: uniqueFacts.length,
        required: puzzleCount,
        message: `Need at least ${puzzleCount} verified facts, but only ${uniqueFacts.length} are available. Run fact ingestion first.`,
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Track usage for category balancing
    const usedFactIds = new Set<string>();
    const recentCategories: string[] = [];
    const categoryUsage7d: Map<string, number> = new Map();
    const categoryUsage30d: Map<string, number> = new Map();
    
    const generatedPuzzles: any[] = [];
    const warnings: string[] = [];
    const categoryStats: Record<string, number> = {};
    const difficultyStats: Record<string, number> = {};
    
    for (let i = 0; i < puzzleCount; i++) {
      const puzzleDate = addDays(startDate, i);
      const dateStr = formatDate(puzzleDate);
      const dayOfWeek = puzzleDate.getDay();
      
      // Skip if puzzle already exists for this date
      if (existingDates.has(dateStr)) {
        warnings.push(`Skipped ${dateStr}: puzzle already exists`);
        continue;
      }
      
      // Find eligible facts for this date
      const eligibleFacts = uniqueFacts.filter(fact => {
        // Not already used in this batch
        if (usedFactIds.has(fact.id)) return false;
        
        // Category constraints
        const category = fact.category;
        
        // No same category on consecutive days
        if (recentCategories.length > 0 && recentCategories[recentCategories.length - 1] === category) {
          return false;
        }
        
        // Max 2 per category in 7-day window
        const usage7d = categoryUsage7d.get(category) || 0;
        if (usage7d >= 2) return false;
        
        // Max 8 per category in 30-day window
        const usage30d = categoryUsage30d.get(category) || 0;
        if (usage30d >= 8) return false;
        
        // Target value constraints (20 to 100,000)
        const target = fact.canonical_value_int;
        if (target < 20 || target > 100000) return false;
        
        return true;
      });
      
      if (eligibleFacts.length === 0) {
        warnings.push(`No eligible facts for ${dateStr} - category constraints too strict`);
        
        // Fallback: relax constraints
        const fallbackFacts = uniqueFacts.filter(fact => {
          if (usedFactIds.has(fact.id)) return false;
          const target = fact.canonical_value_int;
          return target >= 20 && target <= 100000;
        });
        
        if (fallbackFacts.length === 0) {
          warnings.push(`CRITICAL: No facts available for ${dateStr}`);
          continue;
        }
        
        // Use least-used fallback
        eligibleFacts.push(fallbackFacts[0]);
      }
      
      // Sort by preference: least used, then oldest last used
      eligibleFacts.sort((a, b) => {
        if (a.times_used !== b.times_used) return a.times_used - b.times_used;
        if (!a.last_used_date && b.last_used_date) return -1;
        if (a.last_used_date && !b.last_used_date) return 1;
        if (a.last_used_date && b.last_used_date) {
          return new Date(a.last_used_date).getTime() - new Date(b.last_used_date).getTime();
        }
        return 0;
      });
      
      const selectedFact = eligibleFacts[0];
      const target = selectedFact.canonical_value_int;
      
      // Get difficulty config for this day
      const { difficulty, minTile, maxTile } = getDifficultyConfig(dayOfWeek, target);
      
      // Generate the puzzle
      const puzzle = generatePuzzle(target, { minTile, maxTile });
      
      if (!puzzle) {
        warnings.push(`Failed to generate puzzle for ${dateStr} (target: ${target})`);
        continue;
      }
      
      // Create puzzle record
      const puzzleRecord = {
        puzzle_date: dateStr,
        fact_id: selectedFact.id,
        template_id: template.id,
        target_value_int: target,
        tiles: puzzle.tiles,
        solution: puzzle.solution,
        difficulty,
        is_published: false,
        seed: `batch-${Date.now()}-${i}`,
      };
      
      generatedPuzzles.push(puzzleRecord);
      
      // Update tracking
      usedFactIds.add(selectedFact.id);
      recentCategories.push(selectedFact.category);
      if (recentCategories.length > 30) recentCategories.shift();
      
      // Update category usage windows
      categoryUsage7d.set(selectedFact.category, (categoryUsage7d.get(selectedFact.category) || 0) + 1);
      categoryUsage30d.set(selectedFact.category, (categoryUsage30d.get(selectedFact.category) || 0) + 1);
      
      // Slide the 7-day window
      if (i >= 7 && generatedPuzzles[i - 7]) {
        const oldFact = uniqueFacts.find(f => f.id === generatedPuzzles[i - 7].fact_id);
        if (oldFact) {
          const oldUsage = categoryUsage7d.get(oldFact.category) || 0;
          categoryUsage7d.set(oldFact.category, Math.max(0, oldUsage - 1));
        }
      }
      
      // Slide the 30-day window
      if (i >= 30 && generatedPuzzles[i - 30]) {
        const oldFact = uniqueFacts.find(f => f.id === generatedPuzzles[i - 30].fact_id);
        if (oldFact) {
          const oldUsage = categoryUsage30d.get(oldFact.category) || 0;
          categoryUsage30d.set(oldFact.category, Math.max(0, oldUsage - 1));
        }
      }
      
      // Update stats
      categoryStats[selectedFact.category] = (categoryStats[selectedFact.category] || 0) + 1;
      difficultyStats[difficulty] = (difficultyStats[difficulty] || 0) + 1;
    }
    
    console.log(`Generated ${generatedPuzzles.length} puzzles`);
    
    // Insert all puzzles
    if (generatedPuzzles.length > 0) {
      // Insert in batches of 50 to avoid timeout
      const batchSize = 50;
      for (let i = 0; i < generatedPuzzles.length; i += batchSize) {
        const batch = generatedPuzzles.slice(i, i + batchSize);
        const { error: insertError } = await supabase
          .from("measured_daily_puzzles")
          .insert(batch);
        
        if (insertError) {
          throw new Error(`Failed to insert puzzles: ${insertError.message}`);
        }
      }
    }
    
    // Log the generation run
    await supabase.from("measured_audit_log").insert({
      admin_user_id: user.id,
      action: "batch_generate",
      entity_type: "puzzle_batch",
      details: {
        startDate: formatDate(startDate),
        endDate: formatDate(addDays(startDate, puzzleCount - 1)),
        puzzlesGenerated: generatedPuzzles.length,
        categoryStats,
        difficultyStats,
        warnings,
      },
    });
    
    return new Response(
      JSON.stringify({
        success: true,
        puzzlesGenerated: generatedPuzzles.length,
        startDate: formatDate(startDate),
        endDate: formatDate(addDays(startDate, generatedPuzzles.length - 1)),
        categoryStats,
        difficultyStats,
        warnings: warnings.length > 0 ? warnings : undefined,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
    
  } catch (err) {
    console.error("Batch generation error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
