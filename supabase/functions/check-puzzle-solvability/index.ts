import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// BFS algorithm to find shortest path and verify solvability
function findShortestPath(
  start: string,
  goal: string,
  validWords: Set<string>,
  allowTwoLetterChange: boolean = false
): { solvable: boolean; minMoves: number; path: string[] } {
  if (start === goal) {
    return { solvable: true, minMoves: 0, path: [start] };
  }

  const queue: Array<{ word: string; path: string[] }> = [{ word: start, path: [start] }];
  const visited = new Set<string>([start]);
  const wordLength = start.length;

  while (queue.length > 0) {
    const current = queue.shift()!;
    
    // Generate all possible next words
    for (const nextWord of validWords) {
      if (visited.has(nextWord)) continue;
      if (nextWord.length !== wordLength) continue;
      
      // Check if one letter different (or two if allowed)
      let differences = 0;
      for (let i = 0; i < wordLength; i++) {
        if (current.word[i] !== nextWord[i]) differences++;
      }
      
      const maxDiff = allowTwoLetterChange ? 2 : 1;
      if (differences === 0 || differences > maxDiff) continue;
      
      const newPath = [...current.path, nextWord];
      
      // Found the goal!
      if (nextWord === goal) {
        return {
          solvable: true,
          minMoves: newPath.length - 1,
          path: newPath
        };
      }
      
      visited.add(nextWord);
      queue.push({ word: nextWord, path: newPath });
    }
  }
  
  return { solvable: false, minMoves: -1, path: [] };
}

// Load word dictionary from database
async function loadDictionary(supabase: any, wordLength: number): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('admin_dictionary')
    .select('word')
    .eq('word_length', wordLength)
    .eq('is_banned', false);
  
  if (error) {
    console.error('Error loading dictionary:', error);
    return new Set();
  }
  
  return new Set(data.map((row: any) => row.word.toUpperCase()));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check admin role
    const { data: hasAdminRole } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!hasAdminRole) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { startWord, goalWord, wordLength, allowTwoLetterChange = false } = await req.json();

    if (!startWord || !goalWord || !wordLength) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Checking solvability: ${startWord} -> ${goalWord} (${wordLength}L)`);

    // Load dictionary for this word length
    const validWords = await loadDictionary(supabase, wordLength);
    
    if (validWords.size === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No dictionary available for this word length. Please populate the dictionary first.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ensure both words are in the dictionary
    validWords.add(startWord.toUpperCase());
    validWords.add(goalWord.toUpperCase());

    console.log(`Dictionary loaded: ${validWords.size} words`);

    // Run BFS to find shortest path
    const startTime = Date.now();
    const result = findShortestPath(
      startWord.toUpperCase(),
      goalWord.toUpperCase(),
      validWords,
      allowTwoLetterChange
    );
    const duration = Date.now() - startTime;

    console.log(`Solvability check completed in ${duration}ms`);
    console.log(`Result: ${result.solvable ? 'SOLVABLE' : 'UNSOLVABLE'}, minMoves: ${result.minMoves}`);

    return new Response(
      JSON.stringify({
        solvable: result.solvable,
        minMoves: result.minMoves,
        path: result.path,
        pathLength: result.path.length,
        computeTime: duration,
        dictionarySize: validWords.size
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in check-puzzle-solvability:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
