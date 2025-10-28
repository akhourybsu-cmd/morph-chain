import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication failed');
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit
    const { data: rateLimitOk } = await supabase.rpc('check_rate_limit', {
      _user_id: user.id,
      _endpoint: 'get-daily-puzzle',
      _max_requests: 100,
      _window_minutes: 60
    });

    if (!rateLimitOk) {
      console.warn('Rate limit exceeded');
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { wordLength = 4 } = await req.json();

    // Validate wordLength is one of the allowed values
    if (![4, 5, 6].includes(wordLength)) {
      return new Response(
        JSON.stringify({ error: 'Invalid word length. Must be 4, 5, or 6.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get today's puzzle from vault
    const today = new Date().toISOString().split('T')[0];
    const daysSinceEpoch = Math.floor(new Date(today).getTime() / (1000 * 60 * 60 * 24));
    
    // Get total puzzle count for this word length
    const { count } = await supabase
      .from('admin_puzzle_vault')
      .select('*', { count: 'exact', head: true })
      .eq('word_length', wordLength)
      .eq('is_active', true);

    if (!count || count === 0) {
      return new Response(
        JSON.stringify({ error: 'No puzzles available' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate puzzle index for today
    const puzzleIndex = daysSinceEpoch % count;

    // Fetch the puzzle
    const { data: puzzle, error: puzzleError } = await supabase
      .from('admin_puzzle_vault')
      .select('start_word, goal_word, min_distance')
      .eq('word_length', wordLength)
      .eq('puzzle_index', puzzleIndex)
      .eq('is_active', true)
      .single();

    if (puzzleError || !puzzle) {
      console.error('Puzzle not found for requested parameters');
      return new Response(
        JSON.stringify({ error: 'Puzzle not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate max moves (same logic as before)
    const maxMoves = Math.ceil(puzzle.min_distance * 1.5) + 3;

    // Return puzzle data (no puzzle_index or database info exposed)
    return new Response(
      JSON.stringify({
        start: puzzle.start_word,
        goal: puzzle.goal_word,
        minDistance: puzzle.min_distance,
        maxMoves,
        date: today
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error(`[${errorId}] Error in get-daily-puzzle`);
    return new Response(
      JSON.stringify({ error: 'An error occurred. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
